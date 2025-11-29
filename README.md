## Project Overview

This repository contains a small full‑stack application built with **FastAPI** (Python) for the backend and **React + Vite** for the frontend.

The UI replicates the provided designs:

- **Employee list screen** – matches `employee-list-UI.png` with:
  - Top bar with **Add Employee**, **Search**, **Import**, **Export**, and **Filter** actions.
  - Employee table showing **First name, Last name, Contact info icons, Department, Position, Location, Status**.
  - Status displayed as coloured pills (Active, Not started, Terminated).
  - Footer with **“Include terminated employees”** checkbox and pagination controls.
- **Filter panel** – matches `Filter-UI.png` with:
  - Status checkboxes (Active, Not started, Terminated).
  - Dropdowns for **Locations, Companies, Departments, Positions**.

The frontend is wired to the backend API so that search, filters, pagination and the “Include terminated employees” checkbox all affect the data shown.

---

## Backend – FastAPI

Location: `backend/`

### Main Features

- **Endpoints**
  - `GET /health` – simple health check.
  - `GET /employees` – **employee search API** (paginated and filterable).
  - `GET /filters` – returns distinct values for locations, companies, departments and positions to populate the filter dropdowns.
  - `POST /employees` – add a single employee for the current organisation.
  - `POST /employees/import` – import employees from a CSV file.
  - `GET /employees/export` – export employees as a CSV file.
- **Organisations & data isolation**
  - Every request must include header `X-Org-Id` (e.g. `org-1`).
  - Employees belong to an organisation, and the API only returns data for the requested organisation.
  - Tests ensure that data from `org-2` is not visible when querying as `org-1`.
- **Dynamic columns**
  - Per‑organisation column configuration is stored in-memory (could be moved to DB/config file):
    - Example: `org-1` → `["department", "position", "location"]`.
  - The `/employees` response only exposes:
    - Identity fields: `id`, `first_name`, `last_name`, `status`.
    - Columns listed in the org’s configuration, plus a `visible_columns` array.
  - This prevents leaking extra attributes that are not displayed on the UI.
- **Filtering & search**
  - Query parameters:
    - `page` (default: 1)
    - `page_size` (default: 50)
    - `search` – text search over first name, last name, department, position and location.
    - `statuses` – comma‑separated list, e.g. `Active,Not started`.
    - `locations`, `companies`, `departments`, `positions` – comma‑separated lists.
    - `include_terminated` – when `false`, `Terminated` employees are hidden.
  - Response model:
    - `items`: list of serialised employees (see above).
    - `total`: total number of matching employees.
    - `page`, `page_size`.
- **Rate limiting (no external library)**
  - Naive fixed‑window rate limiter using only the Python standard library.
  - Limits requests per `(client_ip, org_id, endpoint)` pair, returning **HTTP 429** when exceeded.
- For simplicity the backend currently uses an **in‑memory list of mock employees** instead of a database. It is structured in a way that you can easily swap the mock data for a real DB later.

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

Useful endpoints for manual checks:

- `http://localhost:8000/health`
- `http://localhost:8000/employees` (with `X-Org-Id` header)
- `http://localhost:8000/filters` (with `X-Org-Id` header)

FastAPI automatically exposes an **OpenAPI specification**:

- Interactive docs: `http://localhost:8000/docs`
- Raw OpenAPI JSON: `http://localhost:8000/openapi.json`

### Running the Backend in Docker

From the project root:

```bash
cd backend
docker build -t employee-api .
docker run -p 8000:8000 employee-api
```

The API will be available at `http://localhost:8000`.

### Backend Tests

Simple unit tests for the search API live in `backend/tests/test_employees.py` and cover:

- Requirement of the `X-Org-Id` header.
- Basic search and shape of the response (no extra attributes leaked).
- Organisation scoping (no cross‑org data leaks).
- Basic rate‑limiting behaviour.

Run tests with:

```bash
cd backend
pip install pytest
pytest
```

---

## Frontend – React + Vite

Location: `frontend/`

### Main Features

- Replaces the Vite starter with an **Employee List** screen:
  - Top action bar (`Add Employee`, `Import`, `Export`, `Filter`, search box).
  - Table that closely mirrors `employee-list-UI.png`:
    - Avatar initials on the first‑name column.
    - Contact icons (mail, chat, phone) in the contact info column.
    - Soft borders, row hover state, and rounded card styling.
  - Footer:
    - “Include terminated employees” checkbox.
    - Pagination controls (Prev / Next, page numbers, page size selector).
- **Filter Panel**:
  - Appears as a centered modal over a dimmed background when clicking **Filter**.
  - Matches `Filter-UI.png` in structure and typography:
    - Status options `Active`, `Not started`, `Terminated` with coloured labels.
    - Dropdowns for **Locations, Companies, Departments, Positions**.
  - Connected to backend:
    - `GET /filters` populates dropdown options.
    - Every change to filters, search, page, page size or checkbox triggers a reload via `GET /employees` (always passing `X-Org-Id: org-1`).
  - **Actions**
    - **Add Employee**: opens a modal form that posts to `POST /employees` and refreshes the list on success.
    - **Import**: opens a file picker and uploads a CSV file to `POST /employees/import`.
    - **Export**: downloads a CSV generated by `GET /employees/export`.

The frontend expects the backend at `http://localhost:8000`. You can change the base URL in `frontend/src/App.jsx` if needed.

### Running the Frontend

From the project root:

```bash
cd frontend
npm install        
npm run dev
```

Then open the URL printed by Vite (usually `http://localhost:5173`).

Make sure the **backend is also running** so the table can load data.

---

## How Things Work Together

1. The React app (in `App.jsx`) keeps local state for:
   - Employees, total count, pagination info.
   - Search text, selected statuses, location, company, department, position.
   - Whether to include terminated employees.
2. Whenever one of these inputs changes, the app constructs a query string and calls:
   - `GET /employees?{query}`.
3. The FastAPI backend filters the in‑memory employee list according to the query parameters and responds with a paginated result list.
4. The React UI renders that response in a table whose layout and styling mimic the provided designs.

---

## Notes / Possible Extensions

- Replace the in‑memory `MOCK_EMPLOYEES` data in `backend/main.py` with a real database using `SQLModel` / `SQLAlchemy` (already present in `requirements.txt`).
- Extend the API to support updates/deletes and richer validation on the **Add Employee / Import** paths.
- Add automated tests for both backend and frontend behaviour if the technical assignment requires it.

---

## CSV Import / Export Format

`POST /employees/import` and `GET /employees/export` both use the same CSV schema:

- Header row (order not important):

```text
id,first_name,last_name,department,position,location,status,company
```

- For imports:
  - Only `first_name` and `last_name` are required; others are optional.
  - `status` defaults to `Active` when omitted.
  - `id` is ignored; the service assigns a fresh, unique id per import row.
- For exports:
  - All columns above are populated; missing values are rendered as empty strings.

