"""
API controller for employee endpoints.
"""
import io
import csv
from typing import Optional
from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile
from fastapi.responses import StreamingResponse
from sqlmodel import Session
from database import get_session
from service.employee_service import EmployeeService
from models.schemas import EmployeeCreate, EmployeeFilters, PagedEmployees
from middleware.rate_limit import check_rate_limit

router = APIRouter(prefix="/employees", tags=["employees"])


def get_org_id(request: Request) -> str:
    """Extract and validate organization ID from request headers."""
    org_id = request.headers.get("X-Org-Id")
    if not org_id:
        raise HTTPException(status_code=400, detail="X-Org-Id header is required")
    return org_id


def get_rate_limit_key(request: Request, org_id: str, endpoint: str) -> str:
    """Generate rate limit key for a request."""
    client_ip = request.client.host if request.client else "unknown"
    return f"{client_ip}:{org_id}:{endpoint}"


def split_comma_separated(value: Optional[str]) -> Optional[list]:
    """Split comma-separated string into list."""
    if value is None or value == "":
        return None
    return [part.strip() for part in value.split(",") if part.strip()]


@router.get("", response_model=PagedEmployees)
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
    Search employees with pagination and filtering.
    
    Multi-select filters are passed as comma-separated strings, e.g.
    ?statuses=Active,Not%20started&locations=Singapore
    """
    org_id = get_org_id(request)
    rate_limit_key = get_rate_limit_key(request, org_id, "employees")
    check_rate_limit(rate_limit_key)
    
    filters = EmployeeFilters(
        statuses=split_comma_separated(statuses),
        locations=split_comma_separated(locations),
        companies=split_comma_separated(companies),
        departments=split_comma_separated(departments),
        positions=split_comma_separated(positions),
        search=search,
        include_terminated=include_terminated,
    )
    
    service = EmployeeService(session)
    return service.search_employees(org_id, page, page_size, filters)


@router.get("/filters")
def get_filter_values(
    request: Request,
    session: Session = Depends(get_session),
) -> dict:
    """Get available filter options for the organization."""
    org_id = get_org_id(request)
    rate_limit_key = get_rate_limit_key(request, org_id, "filters")
    check_rate_limit(rate_limit_key)
    
    service = EmployeeService(session)
    return service.get_filter_options(org_id)


@router.post("", response_model=dict, status_code=201)
def add_employee(
    request: Request,
    payload: dict,
    session: Session = Depends(get_session),
) -> dict:
    """Create a new employee for the current organization."""
    org_id = get_org_id(request)
    rate_limit_key = get_rate_limit_key(request, org_id, "employees:create")
    check_rate_limit(rate_limit_key)
    
    employee_data = EmployeeCreate(**payload)
    service = EmployeeService(session)
    return service.create_employee(org_id, employee_data)


@router.post("/import", status_code=201)
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
    org_id = get_org_id(request)
    rate_limit_key = get_rate_limit_key(request, org_id, "employees:import")
    check_rate_limit(rate_limit_key)
    
    content = await file.read()
    try:
        text_stream = io.StringIO(content.decode("utf-8"))
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="CSV file must be UTF-8 encoded")
    
    reader = csv.DictReader(text_stream)
    employees_data = []
    for row in reader:
        first_name = (row.get("first_name") or "").strip()
        last_name = (row.get("last_name") or "").strip()
        if not first_name or not last_name:
            continue
        
        employees_data.append(
            EmployeeCreate(
                first_name=first_name,
                last_name=last_name,
                department=(row.get("department") or "").strip() or None,
                position=(row.get("position") or "").strip() or None,
                location=(row.get("location") or "").strip() or None,
                status=(row.get("status") or "Active").strip() or "Active",
                company=(row.get("company") or "").strip() or None,
            )
        )
    
    service = EmployeeService(session)
    imported = service.import_employees(org_id, employees_data)
    return {"imported": imported}


@router.get("/export")
def export_employees(
    request: Request,
    session: Session = Depends(get_session),
) -> StreamingResponse:
    """Export all employees for the current organization as CSV."""
    org_id = get_org_id(request)
    rate_limit_key = get_rate_limit_key(request, org_id, "employees:export")
    check_rate_limit(rate_limit_key)
    
    service = EmployeeService(session)
    employees = service.export_employees(org_id)
    
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

