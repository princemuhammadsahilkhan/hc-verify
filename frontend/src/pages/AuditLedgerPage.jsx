import { useEffect, useMemo, useState } from "react";
import { ClipboardList } from "lucide-react";

import API from "../api";

const DEFAULT_PAGE_SIZE = 25;

const CATEGORY_OPTIONS = [
  { value: "all", label: "All events" },
  { value: "registration", label: "Registration events" },
  { value: "verification", label: "Verification events" },
  { value: "voting", label: "Voting events" },
  { value: "admin", label: "Admin events" },
  { value: "system", label: "System events" }
];

function AuditLedgerPage() {
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const loadAudit = async () => {
      setIsLoading(true);

      try {
        const response = await API.get("/public/audit", {
          params: {
            page,
            page_size: pageSize,
            category
          }
        });

        setEntries(response.data.records || []);
        setTotal(response.data.total || 0);
        setPage(response.data.page || 1);
        setPageSize(response.data.page_size || DEFAULT_PAGE_SIZE);
        setTotalPages(response.data.total_pages || 0);
      } catch (error) {
        console.log(error);
        setEntries([]);
        setTotal(0);
        setTotalPages(0);
      } finally {
        setIsLoading(false);
      }
    };

    loadAudit();
  }, [page, pageSize, category]);

  const hasResults = entries.length > 0;

  const pageSummary = useMemo(() => {
    if (!total) {
      return "No events";
    }
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, total);
    return `Showing ${start}-${end} of ${total}`;
  }, [page, pageSize, total]);

  return (
    <div className="page">
      <div className="page-header">
        <div className="eyebrow">
          <ClipboardList size={16} />
          Public audit ledger
        </div>
        <h1 className="section-title">Audit ledger</h1>
        <p className="section-subtitle">
          Public system events only. No sensitive data or internal identifiers are shown.
        </p>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Audit events</h2>
            <p className="card-subtitle">
              Filter by event type to review public-safe audit signals.
            </p>
          </div>
          <div className="status-badge success">Public data</div>
        </div>

        <div className="ledger-toolbar">
          <div className="input-wrap ledger-search">
            <select
              className="ledger-select"
              value={category}
              onChange={(event) => {
                setPage(1);
                setCategory(event.target.value);
              }}
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="results-loading">
            <div className="loading-bar" />
            <div className="loading-bar" />
            <div className="loading-bar" />
          </div>
        ) : hasResults ? (
          <div className="results-list" style={{ marginTop: 18 }}>
            <div className="result-head">
              <span>Event</span>
              <span>Timestamp</span>
              <span>Status</span>
            </div>
            {entries.map((record, index) => (
              <div className="result-item" key={`${record.timestamp}-${index}`}>
                <div className="result-left">
                  <div className="candidate-symbol">AUD</div>
                  <div>
                    <strong>{record.event_type}</strong>
                    <div className="helper-text">{record.category} event</div>
                  </div>
                </div>
                <div>{record.timestamp || "-"}</div>
                <div className="result-right">
                  <span
                    className={`status-badge ${
                      record.status === "Success"
                        ? "success"
                        : "warning"
                    }`}
                  >
                    {record.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state" style={{ marginTop: 16 }}>
            <div className="empty-icon">AUD</div>
            <h3>No audit events found</h3>
            <p>Try another filter option.</p>
          </div>
        )}

        <div className="ledger-footer">
          <span className="ledger-count">{pageSummary}</span>
          <div className="ledger-actions">
            <button
              className="button secondary"
              type="button"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page <= 1 || isLoading}
            >
              Previous
            </button>
            <button
              className="button secondary"
              type="button"
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages || prev + 1))}
              disabled={isLoading || totalPages === 0 || page >= totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuditLedgerPage;
