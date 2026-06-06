import { useEffect, useMemo, useState } from "react";
import { ScrollText, Search } from "lucide-react";

import API from "../api";

const DEFAULT_PAGE_SIZE = 20;

function RegistrationsLedgerPage() {
  const [registrations, setRegistrations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const loadRegistrations = async () => {
      setIsLoading(true);

      try {
        const response = await API.get("/public/registrations", {
          params: {
            page,
            page_size: pageSize,
            q: query
          }
        });

        setRegistrations(response.data.records || []);
        setTotal(response.data.total || 0);
        setPage(response.data.page || 1);
        setPageSize(response.data.page_size || DEFAULT_PAGE_SIZE);
        setTotalPages(response.data.total_pages || 0);
      } catch (error) {
        console.log(error);
        setRegistrations([]);
        setTotal(0);
        setTotalPages(0);
      } finally {
        setIsLoading(false);
      }
    };

    loadRegistrations();
  }, [page, pageSize, query]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setPage(1);
    setQuery(queryInput.trim());
  };

  const handleClear = () => {
    setQueryInput("");
    setQuery("");
    setPage(1);
  };

  const hasResults = registrations.length > 0;

  const pageSummary = useMemo(() => {
    if (!total) {
      return "No registrations";
    }
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, total);
    return `Showing ${start}-${end} of ${total}`;
  }, [page, pageSize, total]);

  return (
    <div className="page">
      <div className="page-header">
        <div className="eyebrow">
          <ScrollText size={16} />
          Public registration ledger
        </div>
        <h1 className="section-title">Registration ledger</h1>
        <p className="section-subtitle">
          Public verification list. Only registration IDs, dates, and status are shown.
        </p>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Registrations</h2>
            <p className="card-subtitle">
              Search by registration ID only. No private voter data is exposed.
            </p>
          </div>
          <div className="status-badge success">Public data</div>
        </div>

        <form className="ledger-toolbar" onSubmit={handleSearchSubmit}>
          <div className="input-wrap ledger-search">
            <Search size={16} />
            <input
              className="input"
              placeholder="Search registration ID"
              value={queryInput}
              onChange={(event) => setQueryInput(event.target.value)}
            />
          </div>
          <button className="button secondary" type="submit">
            Search
          </button>
          {query && (
            <button className="button secondary" type="button" onClick={handleClear}>
              Clear
            </button>
          )}
        </form>

        {isLoading ? (
          <div className="results-loading">
            <div className="loading-bar" />
            <div className="loading-bar" />
            <div className="loading-bar" />
          </div>
        ) : hasResults ? (
          <div className="results-list" style={{ marginTop: 18 }}>
            <div className="result-head">
              <span>Registration ID</span>
              <span>Date</span>
              <span>Status</span>
            </div>
            {registrations.map((record) => (
              <div className="result-item" key={record.registration_id}>
                <div className="result-left">
                  <div className="candidate-symbol">ID</div>
                  <div>
                    <strong>{record.registration_id}</strong>
                    <div className="helper-text">Public identifier</div>
                  </div>
                </div>
                <div>{record.registration_date || "-"}</div>
                <div className="result-right">
                  <span
                    className={`status-badge ${
                      record.status === "Verified"
                        ? "success"
                        : record.status === "Pending"
                        ? "neutral"
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
            <div className="empty-icon">ID</div>
            <h3>No registrations found</h3>
            <p>Try a different registration ID.</p>
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

export default RegistrationsLedgerPage;
