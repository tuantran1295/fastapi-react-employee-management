/**
 * StatusPill component - displays employee status with color coding
 */
const STATUS_COLORS = {
  Active: '#24b47e',
  'Not started': '#4c6fff',
  Terminated: '#ff4d4f',
}

export default function StatusPill({ status }) {
  const color = STATUS_COLORS[status] || '#24b47e'
  return (
    <span className="status-pill" style={{ color, borderColor: color, backgroundColor: `${color}14` }}>
      {status}
    </span>
  )
}

