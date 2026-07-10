import sys

with open("frontend/src/pages/AdminPage.jsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update Navigation Groups
nav_str = '''
        { tab: "Security", label: "Security", icon: Lock },
        { tab: "Election Security", label: "Election Security", icon: ShieldCheck },
'''
content = content.replace('{ tab: "Security", label: "Security", icon: Lock },', nav_str)

# 2. Add State for Security Logs
state_str = '''
  const [securityLogs, setSecurityLogs] = useState([]);
  const [securityBlocks, setSecurityBlocks] = useState([]);
  const [securityLoading, setSecurityLoading] = useState(false);

  const loadElectionSecurity = async () => {
    try {
      setSecurityLoading(true);
      const token = localStorage.getItem("hcverify_admin_token");
      const headers = { Authorization: Bearer  };
      
      const blockRes = await API.get("/admin/security/blockchain", { headers });
      setSecurityBlocks(blockRes.data.blocks || []);
      
      const syncRes = await API.get("/admin/security/sync-logs", { headers });
      setSecurityLogs(syncRes.data.logs || []);
    } catch (error) {
      toast.error("Failed to fetch security logs");
    } finally {
      setSecurityLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "Election Security") {
      loadElectionSecurity();
    }
  }, [tab]);
'''
if "loadElectionSecurity" not in content:
    # insert state variables after the last state variable
    content = content.replace("const [auditExportLoading, setAuditExportLoading] = useState(false);", "const [auditExportLoading, setAuditExportLoading] = useState(false);\n" + state_str)

# 3. Render Tab
tab_str = '''
      {tab === "Election Security" && (
        <div className="card admin-panel" style={{ marginTop: 16 }}>
          <div className="card-header">
            <div>
              <h2 className="card-title"><ShieldCheck size={16} /> Election Security (FYP Demo)</h2>
              <p className="card-subtitle">Transparent view of Blockchain & District Synchronization layers.</p>
            </div>
            <button className="button" style={{ fontSize: 12 }} onClick={loadElectionSecurity}><RefreshCw size={13} /> Refresh</button>
          </div>
          
          <div style={{ padding: '0 24px 24px' }}>
            <h3>Simulated Blockchain Blocks (Layer 3)</h3>
            <div className="admin-list" style={{ marginTop: 16, marginBottom: 32 }}>
              {securityBlocks.length === 0 && !securityLoading && <p>No blocks found.</p>}
              {securityBlocks.map(block => (
                <div key={block.id} className="admin-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <strong>Block #{block.block_index}</strong>
                    <span className="admin-pill success">{block.status}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
                    <div><strong>Receipt Hash:</strong> {block.receipt_hash}</div>
                    <div><strong>Previous Hash:</strong> {block.previous_block_hash}</div>
                    <div><strong>Current Hash:</strong> {block.current_block_hash}</div>
                  </div>
                </div>
              ))}
            </div>

            <h3>District Synchronization Logs (Layer 4)</h3>
            <div className="admin-list" style={{ marginTop: 16 }}>
              {securityLogs.length === 0 && !securityLoading && <p>No sync logs found.</p>}
              {securityLogs.map(log => (
                <div key={log.id} className="admin-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <strong>{log.district_name} - Block #{log.block_index}</strong>
                    <span className="admin-pill success">{log.sync_status}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
                    <div><strong>Sync Hash:</strong> {log.sync_hash}</div>
                    <div><strong>Timestamp:</strong> {new Date(log.sync_timestamp).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MISSING TABS PLACEHOLDERS */}
'''
content = content.replace("{/* \"?\"? MISSING TABS PLACEHOLDERS \"?\"? */}", tab_str.replace("\"?\"?", "\"?\"?"))
content = content.replace("{/* 🚧 MISSING TABS PLACEHOLDERS 🚧 */}", tab_str.replace("🚧", ""))
# Catch generic placeholder string
content = content.replace("{/* ", "{/* ").replace("MISSING TABS PLACEHOLDERS", tab_str)


with open("frontend/src/pages/AdminPage.jsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Updated AdminPage.jsx successfully")