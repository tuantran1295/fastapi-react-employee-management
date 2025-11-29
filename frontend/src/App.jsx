import './App.css'
import { useEffect, useMemo, useState } from 'react'

const API_BASE_URL = 'http://localhost:8000'
const ORG_ID = 'org-1'

const STATUS_COLORS = {
  Active: '#24b47e',
  'Not started': '#4c6fff',
  Terminated: '#ff4d4f',
}

function StatusPill({ status }) {
  const color = STATUS_COLORS[status] || '#24b47e'
  return (
    <span className="status-pill" style={{ color, borderColor: color, backgroundColor: `${color}14` }}>
      {status}
    </span>
  )
}

function Avatar({ firstName, lastName }) {
  const initials = `${(firstName?.[0] || '').toUpperCase()}${(lastName?.[0] || '').toUpperCase()}`
  return <div className="avatar-circle">{initials || 'AA'}</div>
}

function TopBar({
  search,
  onSearchChange,
  onOpenFilters,
  onOpenAdd,
  onImport,
  onExport,
}) {
  return (
    <div className="top-bar">
      <button className="btn btn-primary" onClick={onOpenAdd}>
        <span className="btn-icon">+</span>
        Add Employee
      </button>
      <div className="top-bar-right">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <button className="btn btn-secondary" onClick={onImport}>Import</button>
        <button className="btn btn-secondary" onClick={onExport}>Export</button>
        <button className="btn btn-outline" onClick={onOpenFilters}>
          <span className="filter-icon">⚙️</span>
          Filter
        </button>
      </div>
    </div>
  )
}

function AddEmployeeModal({ isOpen, onClose, onCreated }) {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    department: '',
    position: '',
    location: '',
    status: 'Active',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Org-Id': ORG_ID,
        },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || `Failed to add employee: ${res.status}`)
      }
      onCreated()
      onClose()
      setForm({
        first_name: '',
        last_name: '',
        department: '',
        position: '',
        location: '',
        status: 'Active',
      })
    } catch (err) {
      setError(err.message || 'Unable to add employee')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="filters-overlay">
      <div className="filters-panel">
        <div className="filters-header">
          <h2>Add Employee</h2>
          <button type="button" className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        <form className="add-employee-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="field">
              <div className="filters-label">FIRST NAME</div>
              <input
                className="text-input"
                value={form.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
                required
              />
            </div>
            <div className="field">
              <div className="filters-label">LAST NAME</div>
              <input
                className="text-input"
                value={form.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="field">
              <div className="filters-label">DEPARTMENT</div>
              <input
                className="text-input"
                value={form.department}
                onChange={(e) => handleChange('department', e.target.value)}
              />
            </div>
            <div className="field">
              <div className="filters-label">POSITION</div>
              <input
                className="text-input"
                value={form.position}
                onChange={(e) => handleChange('position', e.target.value)}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="field">
              <div className="filters-label">LOCATION</div>
              <input
                className="text-input"
                value={form.location}
                onChange={(e) => handleChange('location', e.target.value)}
              />
            </div>
            <div className="field">
              <div className="filters-label">STATUS</div>
              <div className="select-wrapper">
                <select
                  value={form.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                >
                  <option value="Active">Active</option>
                  <option value="Not started">Not started</option>
                  <option value="Terminated">Terminated</option>
                </select>
              </div>
            </div>
          </div>
          {error && <div className="error-banner small">{error}</div>}
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EmployeeRow({ employee }) {
  return (
    <tr>
      <td className="cell-name">
        <div className="name-cell-content">
          <Avatar firstName={employee.first_name} lastName={employee.last_name} />
          <div className="name-text">
            <div className="primary-text">
              {employee.first_name}
            </div>
          </div>
        </div>
      </td>
      <td>{employee.last_name}</td>
      <td className="cell-contact">
        <div className="contact-icons">
          <span className="contact-icon">✉️</span>
          <span className="contact-icon">💬</span>
          <span className="contact-icon">📞</span>
        </div>
      </td>
      <td>{employee.department || 'No department'}</td>
      <td>{employee.position || 'No position'}</td>
      <td>{employee.location || 'No location'}</td>
      <td className="cell-status">
        <StatusPill status={employee.status} />
      </td>
    </tr>
  )
}

function EmployeeTable({ employees }) {
  return (
    <div className="table-container">
      <table className="employee-table">
        <thead>
          <tr>
            <th>FIRST NAME</th>
            <th>LAST NAME</th>
            <th>CONTACT INFO</th>
            <th>DEPARTMENT</th>
            <th>POSITION</th>
            <th>LOCATION</th>
            <th>STATUS</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <EmployeeRow key={emp.id} employee={emp} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Pagination({ page, pageSize, total, onChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const pages = []
  for (let i = 1; i <= totalPages; i += 1) {
    pages.push(i)
  }

  return (
    <div className="pagination-bar">
      <div className="results-info">
        Results:
        <select
          value={pageSize}
          onChange={(e) => onChange({ page: 1, pageSize: Number(e.target.value) })}
        >
          {[10, 25, 50].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <span className="results-total">
          of
          {' '}
          {total}
        </span>
      </div>
      <div className="pagination-pages">
        <button
          type="button"
          className="page-link"
          disabled={page <= 1}
          onClick={() => onChange({ page: page - 1 })}
        >
          Prev
        </button>
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            className={`page-link ${p === page ? 'active' : ''}`}
            onClick={() => onChange({ page: p })}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          className="page-link"
          disabled={page >= totalPages}
          onClick={() => onChange({ page: page + 1 })}
        >
          Next
        </button>
      </div>
    </div>
  )
}

function FilterPanel({
  isOpen,
  onClose,
  filters,
  filterOptions,
  onFiltersChange,
}) {
  const handleStatusToggle = (status) => {
    const current = new Set(filters.statuses)
    if (current.has(status)) {
      current.delete(status)
    } else {
      current.add(status)
    }
    onFiltersChange({ ...filters, statuses: Array.from(current) })
  }

  const handleSelectChange = (key, value) => {
    onFiltersChange({ ...filters, [key]: value || null })
  }

  if (!isOpen) return null

  return (
    <div className="filters-overlay">
      <div className="filters-panel">
        <div className="filters-header">
          <h2>Filters</h2>
          <button type="button" className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="filters-section">
          <div className="filters-label">STATUS</div>
          <div className="status-options">
            {['Active', 'Not started', 'Terminated'].map((status) => {
              const checked = filters.statuses.includes(status)
              return (
                <label key={status} className={`status-checkbox ${status.toLowerCase().replace(' ', '-')}`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleStatusToggle(status)}
                  />
                  <span className="custom-checkbox" />
                  <span className="status-text">{status}</span>
                </label>
              )
            })}
          </div>
        </div>

        <hr className="filters-divider" />

        <div className="filters-section grid">
          <div className="field">
            <div className="filters-label">LOCATIONS</div>
            <div className="select-wrapper">
              <select
                value={filters.location || ''}
                onChange={(e) => handleSelectChange('location', e.target.value)}
              >
                <option value="">Locations</option>
                {filterOptions.locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <div className="filters-label">COMPANIES</div>
            <div className="select-wrapper">
              <select
                value={filters.company || ''}
                onChange={(e) => handleSelectChange('company', e.target.value)}
              >
                <option value="">Companies</option>
                {filterOptions.companies.map((company) => (
                  <option key={company} value={company}>
                    {company}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <div className="filters-label">DEPARTMENTS</div>
            <div className="select-wrapper">
              <select
                value={filters.department || ''}
                onChange={(e) => handleSelectChange('department', e.target.value)}
              >
                <option value="">Departments</option>
                {filterOptions.departments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <div className="filters-label">POSITIONS</div>
            <div className="select-wrapper">
              <select
                value={filters.position || ''}
                onChange={(e) => handleSelectChange('position', e.target.value)}
              >
                <option value="">Positions</option>
                {filterOptions.positions.map((position) => (
                  <option key={position} value={position}>
                    {position}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function App() {
  const [employees, setEmployees] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [search, setSearch] = useState('')
  const [includeTerminated, setIncludeTerminated] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    statuses: ['Active', 'Not started'],
    location: null,
    company: null,
    department: null,
    position: null,
  })
  const [filterOptions, setFilterOptions] = useState({
    locations: [],
    companies: [],
    departments: [],
    positions: [],
  })
  const [reloadToken, setReloadToken] = useState(0)

  const queryParams = useMemo(() => {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('page_size', String(pageSize))
    if (search) params.set('search', search)
    if (filters.statuses.length > 0) params.set('statuses', filters.statuses.join(','))
    if (filters.location) params.set('locations', filters.location)
    if (filters.company) params.set('companies', filters.company)
    if (filters.department) params.set('departments', filters.department)
    if (filters.position) params.set('positions', filters.position)
    if (includeTerminated) params.set('include_terminated', 'true')
    // ensure changes to reloadToken re-trigger data fetching
    params.set('_rt', String(reloadToken))
    return params.toString()
  }, [page, pageSize, search, filters, includeTerminated, reloadToken])

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/filters`, {
          headers: {
            'X-Org-Id': ORG_ID,
          },
        })
        if (!res.ok) return
        const data = await res.json()
        setFilterOptions({
          locations: data.locations || [],
          companies: data.companies || [],
          departments: data.departments || [],
          positions: data.positions || [],
        })
      } catch {
        // ignore silently – the UI will still work with default options
      }
    }
    fetchFilters()
  }, [])

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${API_BASE_URL}/employees?${queryParams}`, {
          headers: {
            'X-Org-Id': ORG_ID,
          },
        })
        if (!res.ok) {
          throw new Error(`Failed to load employees: ${res.status}`)
        }
        const data = await res.json()
        setEmployees(data.items || [])
        setTotal(data.total || 0)
      } catch (err) {
        setError(err.message || 'Unable to load employees')
      } finally {
        setLoading(false)
      }
    }
    fetchEmployees()
  }, [queryParams])

  const handlePageChange = ({ page: newPage = page, pageSize: newPageSize = pageSize }) => {
    setPage(newPage)
    setPageSize(newPageSize)
  }

  const handleToggleIncludeTerminated = () => {
    setIncludeTerminated((prev) => !prev)
  }

  const reload = () => {
    setReloadToken((prev) => prev + 1)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv,text/csv'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      setLoading(true)
      setError(null)
      try {
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch(`${API_BASE_URL}/employees/import`, {
          method: 'POST',
          headers: {
            'X-Org-Id': ORG_ID,
          },
          body: formData,
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.detail || `Failed to import: ${res.status}`)
        }
        reload()
      } catch (err) {
        setError(err.message || 'Unable to import employees')
      } finally {
        setLoading(false)
      }
    }
    input.click()
  }

  const handleExport = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/employees/export`, {
        headers: {
          'X-Org-Id': ORG_ID,
        },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || `Failed to export: ${res.status}`)
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'employees.csv'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.message || 'Unable to export employees')
    }
  }

  return (
    <div className="page">
      <TopBar
        search={search}
        onSearchChange={setSearch}
        onOpenFilters={() => setIsFilterOpen(true)}
        onOpenAdd={() => setIsAddOpen(true)}
        onImport={handleImport}
        onExport={handleExport}
      />

      <EmployeeTable employees={employees} />

      <div className="footer-bar">
        <div className="include-terminated">
          <label>
            <input
              type="checkbox"
              checked={includeTerminated}
              onChange={handleToggleIncludeTerminated}
            />
            <span className="custom-checkbox" />
            <span>Include terminated employees</span>
          </label>
        </div>
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onChange={handlePageChange}
        />
      </div>

      {loading && (
        <div className="loading-indicator">
          Loading employees...
        </div>
      )}
      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      <FilterPanel
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        filterOptions={filterOptions}
        onFiltersChange={setFilters}
      />
      <AddEmployeeModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onCreated={reload}
      />
    </div>
  )
}

export default App
