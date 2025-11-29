/**
 * Employee service - handles all API calls related to employees
 */
const API_BASE_URL = 'http://localhost:8000'
const ORG_ID = 'org-1'

const getHeaders = () => ({
  'X-Org-Id': ORG_ID,
})

export const employeeService = {
  /**
   * Search employees with filters and pagination
   */
  async searchEmployees(params) {
    const queryParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        queryParams.set(key, value)
      }
    })
    const res = await fetch(`${API_BASE_URL}/employees?${queryParams}`, {
      headers: getHeaders(),
    })
    if (!res.ok) {
      throw new Error(`Failed to load employees: ${res.status}`)
    }
    return res.json()
  },

  /**
   * Get filter options for the organization
   */
  async getFilterOptions() {
    const res = await fetch(`${API_BASE_URL}/filters`, {
      headers: getHeaders(),
    })
    if (!res.ok) {
      throw new Error(`Failed to load filters: ${res.status}`)
    }
    return res.json()
  },

  /**
   * Create a new employee
   */
  async createEmployee(data) {
    const res = await fetch(`${API_BASE_URL}/employees`, {
      method: 'POST',
      headers: {
        ...getHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.detail || `Failed to add employee: ${res.status}`)
    }
    return res.json()
  },

  /**
   * Import employees from CSV file
   */
  async importEmployees(file) {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch(`${API_BASE_URL}/employees/import`, {
      method: 'POST',
      headers: getHeaders(),
      body: formData,
    })
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.detail || `Failed to import: ${res.status}`)
    }
    return res.json()
  },

  /**
   * Export employees as CSV
   */
  async exportEmployees() {
    const res = await fetch(`${API_BASE_URL}/employees/export`, {
      headers: getHeaders(),
    })
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.detail || `Failed to export: ${res.status}`)
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
  },
}

