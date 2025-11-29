/**
 * AddEmployeeModal component - modal form for adding new employees
 */
import { useState } from 'react'
import { employeeService } from '../services/employeeService'

export default function AddEmployeeModal({ isOpen, onClose, onCreated }) {
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
      await employeeService.createEmployee(form)
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

