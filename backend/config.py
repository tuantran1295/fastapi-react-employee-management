"""
Configuration settings for the application.
"""
from typing import Dict

# Organization column configuration
# Maps organization ID to list of visible columns
ORG_COLUMN_CONFIG: Dict[str, list] = {
    "org-1": ["department", "position", "location"],
    "org-2": ["department", "location"],
}

# Rate limiting configuration
RATE_LIMIT_WINDOW_SECONDS = 60
RATE_LIMIT_MAX_REQUESTS = 60

# Database configuration
DATABASE_URL = "sqlite:///./employees.db"

