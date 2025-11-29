"""
Repository for employee data access operations.
"""
from typing import List, Optional
from sqlmodel import Session, select, func, or_
from models.employee import Employee


class EmployeeRepository:
    """Repository for employee database operations."""
    
    def __init__(self, session: Session):
        self.session = session
    
    def find_by_org(
        self,
        org_id: str,
        statuses: Optional[List[str]] = None,
        locations: Optional[List[str]] = None,
        companies: Optional[List[str]] = None,
        departments: Optional[List[str]] = None,
        positions: Optional[List[str]] = None,
        search: Optional[str] = None,
        include_terminated: bool = False,
    ) -> List[Employee]:
        """
        Find employees by organization with optional filters.
        
        Args:
            org_id: Organization ID
            statuses: Filter by status list
            locations: Filter by location list
            companies: Filter by company list
            departments: Filter by department list
            positions: Filter by position list
            search: Text search across name, department, position, location
            include_terminated: Whether to include terminated employees
        
        Returns:
            List of Employee objects matching the criteria
        """
        query = select(Employee).where(Employee.org_id == org_id)
        
        if not include_terminated:
            query = query.where(Employee.status != "Terminated")
        
        if statuses:
            query = query.where(Employee.status.in_(statuses))
        if locations:
            query = query.where(Employee.location.in_(locations))
        if companies:
            query = query.where(Employee.company.in_(companies))
        if departments:
            query = query.where(Employee.department.in_(departments))
        if positions:
            query = query.where(Employee.position.in_(positions))
        
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
        
        return list(self.session.exec(query).all())
    
    def count_by_org(
        self,
        org_id: str,
        statuses: Optional[List[str]] = None,
        locations: Optional[List[str]] = None,
        companies: Optional[List[str]] = None,
        departments: Optional[List[str]] = None,
        positions: Optional[List[str]] = None,
        search: Optional[str] = None,
        include_terminated: bool = False,
    ) -> int:
        """
        Count employees by organization with optional filters.
        
        Returns:
            Total count of employees matching the criteria
        """
        query = select(Employee).where(Employee.org_id == org_id)
        
        if not include_terminated:
            query = query.where(Employee.status != "Terminated")
        
        if statuses:
            query = query.where(Employee.status.in_(statuses))
        if locations:
            query = query.where(Employee.location.in_(locations))
        if companies:
            query = query.where(Employee.company.in_(companies))
        if departments:
            query = query.where(Employee.department.in_(departments))
        if positions:
            query = query.where(Employee.position.in_(positions))
        
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
        
        return self.session.exec(select(func.count()).select_from(query.subquery())).one()
    
    def create(self, employee: Employee) -> Employee:
        """
        Create a new employee record.
        
        Args:
            employee: Employee object to create
        
        Returns:
            Created Employee object with ID populated
        """
        self.session.add(employee)
        self.session.commit()
        self.session.refresh(employee)
        return employee
    
    def bulk_create(self, employees: List[Employee]) -> None:
        """
        Bulk create employee records.
        
        Args:
            employees: List of Employee objects to create
        """
        self.session.add_all(employees)
        self.session.commit()
    
    def get_all_by_org(self, org_id: str) -> List[Employee]:
        """
        Get all employees for an organization.
        
        Args:
            org_id: Organization ID
        
        Returns:
            List of all Employee objects for the organization
        """
        return list(self.session.exec(select(Employee).where(Employee.org_id == org_id)).all())

