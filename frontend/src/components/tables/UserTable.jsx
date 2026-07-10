export default function UserTable({ users, loading, onEdit, onDelete }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table className="dashboard-table" style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Full Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={5} style={{ padding: 24, textAlign: "center" }}>Loading users...</td>
            </tr>
          ) : users.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ padding: 24, textAlign: "center" }}>No users found</td>
            </tr>
          ) : users.map((user) => (
            <tr key={user.user_id}>
              <td><strong>{user.full_name || "-"}</strong></td>
              <td>{user.email || "-"}</td>
              <td><span className="admin-pill neutral">{user.role || "viewer"}</span></td>
              <td>{user.created_at ? new Date(user.created_at).toLocaleString() : "-"}</td>
              <td>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="button secondary" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => onEdit(user)}>
                    Edit
                  </button>
                  <button className="button secondary" style={{ padding: "6px 10px", fontSize: 12, color: "#991b1b" }} onClick={() => onDelete(user)}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
