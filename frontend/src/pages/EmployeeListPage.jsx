/**
 * EmployeeListPage - main page component for employee list
 */
import { useEffect, useMemo, useState } from 'react'
import TopBar from '../components/TopBar'
import EmployeeTable from '../components/EmployeeTable'
import Pagination from '../components/Pagination'
import FilterPanel from '../components/FilterPanel'
import AddEmployeeModal from '../components/AddEmployeeModal'
import { employeeService } from '../services/employeeService'

export default function EmployeeListPage() {
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
    const params = {
      page: String(page),
      page_size: String(pageSize),
      _rt: String(reloadToken),
    }
    if (search) params.search = search
    if (filters.statuses.length > 0) params.statuses = filters.statuses.join(',')
    if (filters.location) params.locations = filters.location
    if (filters.company) params.companies = filters.company
    if (filters.department) params.departments = filters.department
    if (filters.position) params.positions = filters.position
    if (includeTerminated) params.include_terminated = 'true'
    return params
  }, [page, pageSize, search, filters, includeTerminated, reloadToken])

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const data = await employeeService.getFilterOptions()
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
        const data = await employeeService.searchEmployees(queryParams)
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
        await employeeService.importEmployees(file)
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
      await employeeService.exportEmployees()
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

