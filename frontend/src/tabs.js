import React from 'react';
export const tabs = `
      {tab === "Voters" && (
        <div className="card admin-panel" style={{ marginTop: 16 }}>
          <div className="card-header">
            <div>
              <h2 className="card-title"><UserX size={16} /> Voter registry</h2>
              <p className="card-subtitle">Loaded from GET /admin/voters. Records found: {allVoters.length}</p>
            </div>
            <button className="button" style={{ fontSize: 12 }} onClick={loadAllVoters}><RefreshCw size={13} /> Refresh</button>
          </div>
          {allVoters.length === 0 ? (
            <div className="empty-state" style={{ marginTop: 16 }}>
              <div className="empty-icon">VTR</div>
              <h3>No voters found</h3>
              <p>The database query returned no voter rows.</p>
            </div>
          ) : (
            <div className="admin-list" style={{ marginTop: 16 }}>
              {allVoters.map((voter) => (
                <div key={voter.id} className="admin-row" style={{ flexWrap: "wrap", gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <strong>{voter.full_name}</strong>
                    <span style={{ color: "var(--muted)", fontSize: 12, marginLeft: 8 }}>{voter.cnic}</span>
                  </div>
                  <span className={\`admin-pill \${voter.has_voted ? "success" : "neutral"}\`}>
                    {voter.has_voted ? "Voted" : "Not voted"}
                  </span>
                  <span className={\`admin-pill \${voter.is_pending ? "warning" : "success"}\`}>
                    {voter.is_pending ? "Pending" : "Clear"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "Votes" && (
        <div className="card admin-panel" style={{ marginTop: 16 }}>
          <div className="card-header">
            <div>
              <h2 className="card-title"><VoteIcon size={16} /> Vote ledger</h2>
              <p className="card-subtitle">Loaded from GET /public/votes. Records found: {voteRecords.length}</p>
            </div>
            <button className="button" style={{ fontSize: 12 }} onClick={loadVotes}><RefreshCw size={13} /> Refresh</button>
          </div>
          {votesLoading ? (
            <div className="results-loading">
              <div className="loading-bar" />
              <div className="loading-bar" />
            </div>
          ) : voteRecords.length === 0 ? (
            <div className="empty-state" style={{ marginTop: 16 }}>
              <div className="empty-icon">VOTE</div>
              <h3>No votes found</h3>
              <p>The vote ledger endpoint returned no rows.</p>
            </div>
          ) : (
            <div className="results-list" style={{ marginTop: 18 }}>
              <div className="result-head">
                <span>Receipt</span>
                <span>Timestamp</span>
                <span>Status</span>
              </div>
              {voteRecords.map((vote, index) => (
                <div key={\`\${vote.receipt_id}-\${index}\`} className="result-item">
                  <div className="result-left">
                    <div className="candidate-symbol">V</div>
                    <div>
                      <strong>{vote.receipt_id || "-"}</strong>
                      <div className="helper-text">Public vote ledger record</div>
                    </div>
                  </div>
                  <div>{vote.timestamp || "-"}</div>
                  <div className="result-right">
                    <span className={\`status-badge \${vote.status === "Verified" ? "success" : "neutral"}\`}>
                      {vote.status || "Unknown"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
`
