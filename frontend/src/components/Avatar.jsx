/**
 * Avatar component - displays employee initials in a circle
 */
export default function Avatar({ firstName, lastName }) {
  const initials = `${(firstName?.[0] || '').toUpperCase()}${(lastName?.[0] || '').toUpperCase()}`
  return <div className="avatar-circle">{initials || 'AA'}</div>
}

