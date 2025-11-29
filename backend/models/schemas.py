"""
Pydantic schemas for request/response validation.
"""
from typing import List, Optional
from pydantic import BaseModel


class EmployeeFilters(BaseModel):
    """Filter criteria for employee search."""
    statuses: Optional[List[str]] = None
    locations: Optional[List[str]] = None
    companies: Optional[List[str]] = None
    departments: Optional[List[str]] = None
    positions: Optional[List[str]] = None
    search: Optional[str] = None
    include_terminated: bool = False


class PagedEmployees(BaseModel):
    """Paginated employee response."""
    items: List[dict]
    total: int
    page: int
    page_size: int


class EmployeeCreate(BaseModel):
    """Schema for creating a new employee."""
    first_name: str
    last_name: str
    department: Optional[str] = None
    position: Optional[str] = None
    location: Optional[str] = None
    status: str = "Active"
    company: Optional[str] = None

