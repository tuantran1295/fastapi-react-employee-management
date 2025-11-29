/**
 * FilterPanel component - modal for filtering employees
 */
export default function FilterPanel({
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

