/**
 * Pagination component - displays pagination controls and page size selector
 */
export default function Pagination({ page, pageSize, total, onChange }) {
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

