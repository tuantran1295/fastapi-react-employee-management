## Project Overview

This repository contains a full‑stack application built with **FastAPI** (Python) for the backend and **React + Vite** for the frontend. The application implements an employee management system with search, filtering, pagination, and CRUD operations.

The UI replicates the provided designs:
- **Employee list screen** – matches `employee-list-UI.png`
- **Filter panel** – matches `Filter-UI.png`

---

## Project Structure

```
fastapi-react-technical-assignment/
├── backend/                          # FastAPI backend application
│   ├── config.py                     # Configuration settings (rate limits, DB URL, org column config)
│   ├── database.py                   # Database connection and session management
│   ├── main.py                       # FastAPI app entry point, routes registration, startup events
│   ├── seed.py                       # Database seeding script for initial data
│   ├── requirements.txt              # Python dependencies
│   ├── Dockerfile                    # Docker configuration for containerization
│   ├── models/                       # Database models and Pydantic schemas
│   │   ├── __init__.py
│   │   ├── employee.py               # Employee SQLModel database model
│   │   └── schemas.py                # Pydantic schemas for request/response validation
│   ├── repository/                   # Data access layer
│   │   ├── __init__.py
│   │   └── employee_repository.py    # Employee database operations (CRUD, queries)
│   ├── service/                      # Business logic layer
│   │   ├── __init__.py
│   │   └── employee_service.py       # Employee business logic (serialization, filtering)
│   ├── controller/                   # API endpoints/routes
│   │   ├── __init__.py
│   │   └── employee_controller.py   # Employee API routes (GET, POST endpoints)
│   ├── middleware/                   # Middleware components
│   │   ├── __init__.py
│   │   └── rate_limit.py            # Rate limiting middleware (standard library only)
│   └── tests/                        # Unit tests
│       └── test_employees.py        # Tests for employee endpoints
│
├── frontend/                         # React + Vite frontend application
│   ├── src/
│   │   ├── App.jsx                   # Root component, renders EmployeeListPage
│   │   ├── App.css                   # Global application styles
│   │   ├── main.jsx                  # React entry point
│   │   ├── index.css                 # Base CSS styles
│   │   ├── components/               # Reusable UI components
│   │   │   ├── Avatar.jsx            # Employee avatar with initials
│   │   │   ├── StatusPill.jsx        # Status badge with color coding
│   │   │   ├── TopBar.jsx            # Top action bar (Add, Search, Import, Export, Filter)
│   │   │   ├── EmployeeTable.jsx     # Employee data table
│   │   │   ├── Pagination.jsx        # Pagination controls
│   │   │   ├── FilterPanel.jsx       # Filter modal component
│   │   │   └── AddEmployeeModal.jsx  # Add employee form modal
│   │   ├── pages/                    # Page components
│   │   │   └── EmployeeListPage.jsx  # Main employee list page with state management
│   │   └── services/                 # API service layer
│   │       └── employeeService.js   # Employee API calls (fetch, create, import, export)
│   ├── package.json                  # Node.js dependencies
│   ├── vite.config.js                # Vite configuration
│   └── index.html                    # HTML entry point
│
├── .gitignore                        # Git ignore rules for Python, Node.js, and IDE files
├── README.md                         # This file
└── [UI design files]                 # employee-list-UI.png, Filter-UI.png, Technical assignment.docx
```

---

## Backend – FastAPI

Location: `backend/`

### Architecture

The backend follows a **layered architecture**:

1. **Models** (`models/`): Database models (SQLModel) and Pydantic schemas
2. **Repository** (`repository/`): Data access layer - handles all database queries
3. **Service** (`service/`): Business logic layer - handles serialization, filtering, and business rules
4. **Controller** (`controller/`): API endpoints - handles HTTP requests/responses
5. **Middleware** (`middleware/`): Cross-cutting concerns like rate limiting

### Key Files

- **`config.py`**: Configuration settings including organization column config, rate limits, and database URL
- **`database.py`**: Database engine setup and session dependency injection
- **`main.py`**: FastAPI app initialization, CORS setup, route registration, and startup events
- **`seed.py`**: Database seeding script - populates initial employee data if database is empty
- **`models/employee.py`**: Employee database model with all fields
- **`models/schemas.py`**: Pydantic schemas for API request/response validation
- **`repository/employee_repository.py`**: All database queries (find, count, create, bulk create)
- **`service/employee_service.py`**: Business logic (serialization with org-specific columns, search, filtering)
- **`controller/employee_controller.py`**: API endpoints (GET /employees, POST /employees, etc.)
- **`middleware/rate_limit.py`**: Rate limiting implementation using only standard library

### Main Features

- **Endpoints**
  - `GET /health` – health check
  - `GET /employees` – employee search API (paginated and filterable)
  - `GET /filters` – returns distinct values for filter dropdowns
  - `POST /employees` – add a single employee
  - `POST /employees/import` – import employees from CSV
  - `GET /employees/export` – export employees as CSV

- **Organisations & data isolation**
  - Every request must include header `X-Org-Id` (e.g. `org-1`)
  - Employees belong to an organisation, and the API only returns data for the requested organisation
  - Tests ensure that data from `org-2` is not visible when querying as `org-1`

- **Dynamic columns**
  - Per‑organisation column configuration stored in `config.py`
  - Example: `org-1` → `["department", "position", "location"]`
  - The `/employees` response only exposes identity fields plus configured columns
  - Prevents leaking extra attributes not displayed on the UI

- **Database**: SQLite database (`employees.db`) with SQLModel ORM

- **Rate limiting**: Naive fixed‑window rate limiter using only the Python standard library

### Running the Backend

From the project root:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt

uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`.

**Useful endpoints:**
- `http://localhost:8000/health`
- `http://localhost:8000/employees` (with `X-Org-Id` header)
- `http://localhost:8000/filters` (with `X-Org-Id` header)
- Interactive docs: `http://localhost:8000/docs`
- OpenAPI JSON: `http://localhost:8000/openapi.json`

### Running the Backend in Docker

```bash
cd backend
docker build -t employee-api .
docker run -p 8000:8000 employee-api
```

### Backend Tests

Tests are located in `backend/tests/test_employees.py` and cover:
- Requirement of the `X-Org-Id` header
- Basic search and response shape (no extra attributes leaked)
- Organisation scoping (no cross‑org data leaks)
- Basic rate‑limiting behaviour

Run tests with:

```bash
cd backend
pip install pytest
pytest
```

---

## Frontend – React + Vite

Location: `frontend/`

### Architecture

The frontend follows a **component-based architecture**:

1. **Components** (`components/`): Reusable UI components
2. **Pages** (`pages/`): Page-level components with state management
3. **Services** (`services/`): API service layer for all backend communication

### Key Files

- **`App.jsx`**: Root component that renders the main page
- **`pages/EmployeeListPage.jsx`**: Main page component with all state management and business logic
- **`services/employeeService.js`**: Centralized API service for all employee-related API calls
- **`components/`**: Reusable UI components:
  - `Avatar.jsx`: Displays employee initials in a circle
  - `StatusPill.jsx`: Status badge with color coding
  - `TopBar.jsx`: Top action bar with buttons and search
  - `EmployeeTable.jsx`: Employee data table
  - `Pagination.jsx`: Pagination controls
  - `FilterPanel.jsx`: Filter modal
  - `AddEmployeeModal.jsx`: Add employee form modal

### Main Features

- **Employee List Page**:
  - Top action bar (Add Employee, Search, Import, Export, Filter)
  - Employee table with avatars, contact icons, and status badges
  - Footer with "Include terminated employees" checkbox and pagination
  - Filter panel modal
  - Add employee modal

- **Actions**:
  - **Add Employee**: Opens modal form, posts to `POST /employees`, refreshes list
  - **Import**: File picker uploads CSV to `POST /employees/import`
  - **Export**: Downloads CSV from `GET /employees/export`
  - **Search**: Real-time search across employee fields
  - **Filter**: Modal with status checkboxes and dropdown filters

### Running the Frontend

From the project root:

```bash
cd frontend
npm install
npm run dev
```

Then open the URL printed by Vite (usually `http://localhost:5173`).

**Note**: Make sure the **backend is also running** so the table can load data.

---

## CSV Import / Export Format

`POST /employees/import` and `GET /employees/export` both use the same CSV schema:

**Header row** (order not important):
```text
id,first_name,last_name,department,position,location,status,company
```

**For imports:**
- Only `first_name` and `last_name` are required; others are optional
- `status` defaults to `Active` when omitted
- `id` is ignored; the service assigns a fresh, unique id per import row

**For exports:**
- All columns above are populated; missing values are rendered as empty strings

---

## Development Notes

- The backend uses **SQLite** for simplicity, but the architecture supports easy migration to PostgreSQL/MySQL
- Rate limiting is implemented using only the Python standard library (no external dependencies)
- The frontend uses a service layer pattern to centralize all API calls
- Components are separated for reusability and maintainability
- The project structure follows clean architecture principles with clear separation of concerns

---

## Possible Extensions

- Add update/delete endpoints for employees
- Implement authentication and authorization
- Add more comprehensive validation
- Extend tests to cover more edge cases
- Add frontend unit tests
- Implement real-time updates with WebSockets
- Add employee detail view/edit page
