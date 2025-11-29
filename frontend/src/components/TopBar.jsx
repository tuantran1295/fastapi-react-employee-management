/**
 * TopBar component - displays action buttons and search bar
 */
export default function TopBar({
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

