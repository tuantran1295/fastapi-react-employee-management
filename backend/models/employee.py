"""
Employee database model.
"""
from typing import Optional
from sqlmodel import Field, SQLModel


class Employee(SQLModel, table=True):
    """
    Employee model representing an employee record in the database.
    
    Attributes:
        id: Primary key, auto-generated
        org_id: Organization ID for multi-tenancy isolation
        first_name: Employee's first name (required)
        last_name: Employee's last name (required)
        department: Department name (optional)
        position: Job position/title (optional)
        location: Work location (optional)
        status: Employment status (Active, Not started, Terminated)
        company: Company name (optional)
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    org_id: str
    first_name: str
    last_name: str
    department: Optional[str] = None
    position: Optional[str] = None
    location: Optional[str] = None
    status: str
    company: Optional[str] = None

