"""
Service layer for employee business logic.
"""
from typing import Dict, List, Optional
from sqlmodel import Session
from repository.employee_repository import EmployeeRepository
from models.employee import Employee
from models.schemas import EmployeeCreate, EmployeeFilters, PagedEmployees
from config import ORG_COLUMN_CONFIG


class EmployeeService:
    """Service for employee business logic."""
    
    def __init__(self, session: Session):
        self.repository = EmployeeRepository(session)
    
    def serialize_employee(self, emp: Employee, org_id: str) -> dict:
        """
        Serialize an employee to a dictionary that only exposes:
        - Identity fields (id, first_name, last_name, status)
        - Dynamic columns defined for this organization.
        
        This prevents leaking extra attributes that are not intended to be shown on the UI.
        
        Args:
            emp: Employee object to serialize
            org_id: Organization ID to determine visible columns
        
        Returns:
            Dictionary with only visible fields
        """
        configured_columns = ORG_COLUMN_CONFIG.get(org_id, ["department", "position", "location"])
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
    
    def search_employees(
        self,
        org_id: str,
        page: int = 1,
        page_size: int = 50,
        filters: Optional[EmployeeFilters] = None,
    ) -> PagedEmployees:
        """
        Search employees with pagination and filtering.
        
        Args:
            org_id: Organization ID
            page: Page number (1-indexed)
            page_size: Number of items per page
            filters: Optional filter criteria
        
        Returns:
            PagedEmployees object with items, total, page, page_size
        """
        if filters is None:
            filters = EmployeeFilters()
        
        employees = self.repository.find_by_org(
            org_id=org_id,
            statuses=filters.statuses,
            locations=filters.locations,
            companies=filters.companies,
            departments=filters.departments,
            positions=filters.positions,
            search=filters.search,
            include_terminated=filters.include_terminated,
        )
        
        total = len(employees)
        offset = (page - 1) * page_size
        paginated_employees = employees[offset:offset + page_size]
        
        items = [self.serialize_employee(emp, org_id) for emp in paginated_employees]
        
        return PagedEmployees(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
        )
    
    def create_employee(self, org_id: str, employee_data: EmployeeCreate) -> dict:
        """
        Create a new employee.
        
        Args:
            org_id: Organization ID
            employee_data: Employee creation data
        
        Returns:
            Serialized employee dictionary
        """
        employee = Employee(
            org_id=org_id,
            first_name=employee_data.first_name,
            last_name=employee_data.last_name,
            department=employee_data.department,
            position=employee_data.position,
            location=employee_data.location,
            status=employee_data.status,
            company=employee_data.company,
        )
        created = self.repository.create(employee)
        return self.serialize_employee(created, org_id)
    
    def import_employees(self, org_id: str, employees_data: List[EmployeeCreate]) -> int:
        """
        Bulk import employees.
        
        Args:
            org_id: Organization ID
            employees_data: List of employee creation data
        
        Returns:
            Number of employees imported
        """
        employees = [
            Employee(
                org_id=org_id,
                first_name=emp.first_name,
                last_name=emp.last_name,
                department=emp.department,
                position=emp.position,
                location=emp.location,
                status=emp.status,
                company=emp.company,
            )
            for emp in employees_data
        ]
        self.repository.bulk_create(employees)
        return len(employees)
    
    def get_filter_options(self, org_id: str) -> dict:
        """
        Get available filter options for an organization.
        
        Args:
            org_id: Organization ID
        
        Returns:
            Dictionary with statuses, locations, companies, departments, positions, visible_columns
        """
        employees = self.repository.get_all_by_org(org_id)
        
        statuses = sorted({emp.status for emp in employees})
        locations = sorted({emp.location for emp in employees if emp.location})
        companies = sorted({emp.company for emp in employees if emp.company})
        departments = sorted({emp.department for emp in employees if emp.department})
        positions = sorted({emp.position for emp in employees if emp.position})
        
        configured_columns = ORG_COLUMN_CONFIG.get(org_id, ["department", "position", "location"])
        
        return {
            "statuses": statuses,
            "locations": locations,
            "companies": companies,
            "departments": departments,
            "positions": positions,
            "visible_columns": configured_columns,
        }
    
    def export_employees(self, org_id: str) -> List[Employee]:
        """
        Get all employees for export.
        
        Args:
            org_id: Organization ID
        
        Returns:
            List of all Employee objects for the organization
        """
        return self.repository.get_all_by_org(org_id)

