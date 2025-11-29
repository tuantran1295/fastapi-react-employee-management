/**
 * EmployeeTable component - displays employee data in a table
 */
import Avatar from './Avatar'
import StatusPill from './StatusPill'

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

export default function EmployeeTable({ employees }) {
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

