from typing import Dict, List, Optional, Tuple
import io
import csv
import time

from fastapi import Depends, FastAPI, HTTPException, Request, UploadFile, File
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlmodel import Field, Session, SQLModel, create_engine, select
from sqlalchemy import func, or_


class Employee(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    org_id: str
    first_name: str
    last_name: str
    department: Optional[str] = None
    position: Optional[str] = None
    location: Optional[str] = None
    status: str
    company: Optional[str] = None


class EmployeeFilters(BaseModel):
    statuses: Optional[List[str]] = None
    locations: Optional[List[str]] = None
    companies: Optional[List[str]] = None
    departments: Optional[List[str]] = None
    positions: Optional[List[str]] = None
    search: Optional[str] = None
    include_terminated: bool = False


class PagedEmployees(BaseModel):
    items: List[dict]
    total: int
    page: int
    page_size: int


MOCK_ORG_COLUMN_CONFIG: Dict[str, List[str]] = {
    # Organisation "org-1" shows department, position, location – matches the sample UI.
    "org-1": ["department", "position", "location"],
    # Example: an organisation that only wants department and location.
    "org-2": ["department", "location"],
}

RATE_LIMIT_WINDOW_SECONDS = 60
RATE_LIMIT_MAX_REQUESTS = 60
_rate_limit_state: Dict[str, Tuple[float, int]] = {}


def check_rate_limit(client_key: str) -> None:
    """
    Naive fixed-window rate limiter implemented with only the standard library.

    Limits each client (by IP + org) to RATE_LIMIT_MAX_REQUESTS per RATE_LIMIT_WINDOW_SECONDS.
    Raises HTTPException(429) when the limit is exceeded.
    """
    now = time.time()
    window_start, count = _rate_limit_state.get(client_key, (now, 0))

    if now - window_start >= RATE_LIMIT_WINDOW_SECONDS:
        window_start = now
        count = 0

    count += 1
    _rate_limit_state[client_key] = (window_start, count)

    if count > RATE_LIMIT_MAX_REQUESTS:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")


DATABASE_URL = "sqlite:///./employees.db"
engine = create_engine(DATABASE_URL, echo=False, connect_args={"check_same_thread": False})


def get_session() -> Session:
    with Session(engine) as session:
        yield session


def init_db() -> None:
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        existing = session.exec(select(func.count()).select_from(Employee)).one()
        if existing:
            return

        seed_employees = [
            Employee(
                org_id="org-1",
                first_name="Amelia",
                last_name="Last",
                department="asd",
                position="Assistant Manager",
                location="Singapore",
                status="Active",
                company="Sleek",
            ),
            Employee(
                org_id="org-1",
                first_name="Ana",
                last_name="Test",
                department="No department",
                position="No position",
                location="No location",
                status="Active",
                company="Sleek",
            ),
            Employee(
                org_id="org-1",
                first_name="Arlani",
                last_name="Sosaia",
                department="No department",
                position="No position",
                location="Somewhere",
                status="Not started",
                company="Sleek",
            ),
            Employee(
                org_id="org-1",
                first_name="Terminated",
                last_name="Employee",
                department="No department",
                position="No position",
                location="Nowhere",
                status="Terminated",
                company="Sleek",
            ),
            Employee(
                org_id="org-2",
                first_name="OtherOrg",
                last_name="User",
                department="Other Department",
                position="Other Position",
                location="Other City",
                status="Active",
                company="Other Co",
            ),
        ]
        session.add_all(seed_employees)
        session.commit()


app = FastAPI(title="Employee API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


def _serialize_employee(emp: Employee, org_id: str) -> dict:
    """
    Serialise an internal Employee to a dictionary that only exposes:
    - Identity fields (id, first_name, last_name, status)
    - Dynamic columns defined for this organisation.

    This prevents leaking extra attributes that are not intended to be shown on the UI.
    """
    configured_columns = MOCK_ORG_COLUMN_CONFIG.get(org_id, ["department", "position", "location"])
    visible_columns = [c for c in configured_columns if c in {"department", "position", "location"}]

    result: Dict[str, Optional[str]] = {
        "id": emp.id,
        "first_name": emp.first_name,
        "last_name": emp.last_name,
        "status": emp.status,
    }
    for column in visible_columns:
        result[column] = getattr(emp, column)
    result["visible_columns"] = visible_columns
    return result


@app.get("/employees", response_model=PagedEmployees)
def list_employees(
    request: Request,
    session: Session = Depends(get_session),
    page: int = 1,
    page_size: int = 50,
    search: Optional[str] = None,
    statuses: Optional[str] = None,
    locations: Optional[str] = None,
    companies: Optional[str] = None,
    departments: Optional[str] = None,
    positions: Optional[str] = None,
    include_terminated: bool = False,
) -> PagedEmployees:
    """
    Simple in-memory list endpoint with filtering and pagination.

    Multi-select filters are passed as comma-separated strings, e.g.
    ?statuses=Active,Not%20started&locations=Singapore
    """

    org_id = request.headers.get("X-Org-Id")
    if not org_id:
        raise HTTPException(status_code=400, detail="X-Org-Id header is required")

    client_ip = request.client.host if request.client else "unknown"
    rate_limit_key = f"{client_ip}:{org_id}:employees"
    check_rate_limit(rate_limit_key)

    def split(value: Optional[str]) -> Optional[List[str]]:
        if value is None or value == "":
            return None
        return [part.strip() for part in value.split(",") if part.strip()]

    status_list = split(statuses)
    location_list = split(locations)
    company_list = split(companies)
    department_list = split(departments)
    position_list = split(positions)

    query = select(Employee).where(Employee.org_id == org_id)

    if not include_terminated:
        query = query.where(Employee.status != "Terminated")

    if status_list:
        query = query.where(Employee.status.in_(status_list))
    if location_list:
        query = query.where(Employee.location.in_(location_list))
    if company_list:
        query = query.where(Employee.company.in_(company_list))
    if department_list:
        query = query.where(Employee.department.in_(department_list))
    if position_list:
        query = query.where(Employee.position.in_(position_list))

    if search:
        like_pattern = f"%{search.lower()}%"
        query = query.where(
            or_(
                func.lower(Employee.first_name).like(like_pattern),
                func.lower(Employee.last_name).like(like_pattern),
                func.lower(Employee.department).like(like_pattern),
                func.lower(Employee.position).like(like_pattern),
                func.lower(Employee.location).like(like_pattern),
            )
        )

    total = session.exec(select(func.count()).select_from(query.subquery())).one()
    offset = (page - 1) * page_size
    employees = session.exec(query.offset(offset).limit(page_size)).all()
    items: List[dict] = [_serialize_employee(emp, org_id) for emp in employees]

    return PagedEmployees(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
    )


@app.get("/filters")
def get_filter_values(request: Request, session: Session = Depends(get_session)) -> dict:
    org_id = request.headers.get("X-Org-Id")
    if not org_id:
        raise HTTPException(status_code=400, detail="X-Org-Id header is required")

    client_ip = request.client.host if request.client else "unknown"
    rate_limit_key = f"{client_ip}:{org_id}:filters"
    check_rate_limit(rate_limit_key)

    org_employees = session.exec(select(Employee).where(Employee.org_id == org_id)).all()

    statuses = sorted({emp.status for emp in org_employees})
    locations = sorted({emp.location for emp in org_employees if emp.location})
    companies = sorted({emp.company for emp in org_employees if emp.company})
    departments = sorted({emp.department for emp in org_employees if emp.department})
    positions = sorted({emp.position for emp in org_employees if emp.position})

    configured_columns = MOCK_ORG_COLUMN_CONFIG.get(org_id, ["department", "position", "location"])

    return {
        "statuses": statuses,
        "locations": locations,
        "companies": companies,
        "departments": departments,
        "positions": positions,
        "visible_columns": configured_columns,
    }


@app.post("/employees", response_model=dict, status_code=201)
def add_employee(
    request: Request,
    payload: dict,
    session: Session = Depends(get_session),
) -> dict:
    """
    Create a new employee for the current organisation.

    This is intentionally minimal and uses the in-memory store only.
    """
    org_id = request.headers.get("X-Org-Id")
    if not org_id:
        raise HTTPException(status_code=400, detail="X-Org-Id header is required")

    client_ip = request.client.host if request.client else "unknown"
    rate_limit_key = f"{client_ip}:{org_id}:employees:create"
    check_rate_limit(rate_limit_key)

    status = payload.get("status") or "Active"
    first_name = payload.get("first_name") or ""
    last_name = payload.get("last_name") or ""
    department = payload.get("department")
    position = payload.get("position")
    location = payload.get("location")
    company = payload.get("company")

    if not first_name or not last_name:
        raise HTTPException(status_code=400, detail="first_name and last_name are required")

    emp = Employee(
        org_id=org_id,
        first_name=first_name,
        last_name=last_name,
        department=department,
        position=position,
        location=location,
        status=status,
        company=company,
    )
    session.add(emp)
    session.commit()
    session.refresh(emp)
    return _serialize_employee(emp, org_id)


@app.post("/employees/import", status_code=201)
async def import_employees(
    request: Request,
    session: Session = Depends(get_session),
    file: UploadFile = File(...),
) -> dict:
    """
    Import employees from a CSV file.

    Expected columns (header row, order not important):
    first_name,last_name,department,position,location,status,company
    """
    org_id = request.headers.get("X-Org-Id")
    if not org_id:
        raise HTTPException(status_code=400, detail="X-Org-Id header is required")

    client_ip = request.client.host if request.client else "unknown"
    rate_limit_key = f"{client_ip}:{org_id}:employees:import"
    check_rate_limit(rate_limit_key)

    content = await file.read()
    try:
        text_stream = io.StringIO(content.decode("utf-8"))
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="CSV file must be UTF-8 encoded")

    reader = csv.DictReader(text_stream)
    imported = 0
    for row in reader:
        first_name = (row.get("first_name") or "").strip()
        last_name = (row.get("last_name") or "").strip()
        if not first_name or not last_name:
            continue

        emp = Employee(
            org_id=org_id,
            first_name=first_name,
            last_name=last_name,
            department=(row.get("department") or "").strip() or None,
            position=(row.get("position") or "").strip() or None,
            location=(row.get("location") or "").strip() or None,
            status=(row.get("status") or "Active").strip() or "Active",
            company=(row.get("company") or "").strip() or None,
        )
        session.add(emp)
        imported += 1

    session.commit()
    return {"imported": imported}


@app.get("/employees/export")
def export_employees(
    request: Request,
    session: Session = Depends(get_session),
) -> StreamingResponse:
    """
    Export all employees for the current organisation as CSV.
    """
    org_id = request.headers.get("X-Org-Id")
    if not org_id:
        raise HTTPException(status_code=400, detail="X-Org-Id header is required")

    client_ip = request.client.host if request.client else "unknown"
    rate_limit_key = f"{client_ip}:{org_id}:employees:export"
    check_rate_limit(rate_limit_key)

    output = io.StringIO()
    fieldnames = [
        "id",
        "first_name",
        "last_name",
        "department",
        "position",
        "location",
        "status",
        "company",
    ]
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    employees = session.exec(select(Employee).where(Employee.org_id == org_id)).all()
    for emp in employees:
        writer.writerow(
            {
                "id": emp.id,
                "first_name": emp.first_name,
                "last_name": emp.last_name,
                "department": emp.department or "",
                "position": emp.position or "",
                "location": emp.location or "",
                "status": emp.status,
                "company": emp.company or "",
            }
        )

    output.seek(0)
    headers = {"Content-Disposition": 'attachment; filename="employees.csv"'}
    return StreamingResponse(
        iter([output.getvalue().encode("utf-8")]),
        media_type="text/csv",
        headers=headers,
    )


@app.on_event("startup")
def on_startup() -> None:
    init_db()
