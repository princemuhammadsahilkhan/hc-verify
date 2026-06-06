import { useEffect, useMemo, useState } from "react";
import { ShieldCheck, Search } from "lucide-react";

import API from "../api";

const DEFAULT_PAGE_SIZE = 20;

function VotesLedgerPage() {
  const [votes, setVotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const loadVotes = async () => {
      setIsLoading(true);

      try {
        const response = await API.get("/public/votes", {
          params: {
            page,
            page_size: pageSize,
            q: query
          }
        });

        setVotes(response.data.records || []);
        setTotal(response.data.total || 0);
        setPage(response.data.page || 1);
        setPageSize(response.data.page_size || DEFAULT_PAGE_SIZE);
        setTotalPages(response.data.total_pages || 0);
      } catch (error) {
        console.log(error);
        setVotes([]);
        setTotal(0);
        setTotalPages(0);
      } finally {
        setIsLoading(false);
      }
    };

    loadVotes();
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

  const hasResults = votes.length > 0;

  const pageSummary = useMemo(() => {
    if (!total) {
      return "No votes";
    }
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, total);
    return `Showing ${start}-${end} of ${total}`;
  }, [page, pageSize, total]);

  return (
    <div className="page">
      <div className="page-header">
        <div className="eyebrow">
          <ShieldCheck size={16} />
          Public vote ledger
        </div>
        <h1 className="section-title">Vote ledger</h1>
        <p className="section-subtitle">
          Public verification list. No voter identities or ballot choices are shown.
        </p>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Votes</h2>
            <p className="card-subtitle">
              Search by receipt ID or verification code only.
            </p>
          </div>
          <div className="status-badge success">Public data</div>
        </div>

        <form className="ledger-toolbar" onSubmit={handleSearchSubmit}>
          <div className="input-wrap ledger-search">
            <Search size={16} />
            <input
              className="input"
              placeholder="Search receipt ID or verification code"
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
              <span>Receipt ID</span>
              <span>Timestamp</span>
              <span>Status</span>
            </div>
            {votes.map((record) => (
              <div className="result-item" key={record.receipt_id}>
                <div className="result-left">
                  <div className="candidate-symbol">RCPT</div>
                  <div>
                    <strong>{record.receipt_id}</strong>
                    <div className="helper-text">Public receipt reference</div>
                  </div>
                </div>
                <div>{record.timestamp || "-"}</div>
                <div className="result-right">
                  <span
                    className={`status-badge ${
                      record.status === "Verified"
                        ? "success"
                        : record.status === "Pending Verification"
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
            <div className="empty-icon">RCPT</div>
            <h3>No votes found</h3>
            <p>Try a different receipt ID or verification code.</p>
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

export default VotesLedgerPage;
