import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  Trophy,
  TrendingUp,
  Users,
  Vote as VoteIcon,
  Medal
} from "lucide-react";
import API from "../api";

function ResultsPage() {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadResults = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        const resultsRes = await API.get("/results", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setResults(resultsRes.data);
      } catch (error) {
        if ([401, 403].includes(error.response?.status)) {
          localStorage.removeItem("adminToken");
          navigate("/admin-login", { replace: true });
          return;
        }
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadResults();
  }, []);

  const totalVotes = results.reduce(
    (sum, item) => sum + item.votes,
    0
  );

  const sortedResults = [...results].sort(
    (a, b) => b.votes - a.votes
  );

  const leader = sortedResults[0];

  const isEmpty = !isLoading && results.length === 0;

  return (
    <div className="page">
      <div className="page-header">
        <div className="eyebrow">
          <BarChart3 size={16} />
          Election results
        </div>
        <h1 className="section-title">
          Results dashboard
        </h1>
        <p className="section-subtitle">
          A real-time summary of votes recorded on the public ledger.
        </p>
      </div>

      <div className="results-metrics">
        <div className="metric-card">
          <div className="metric-icon">
            <Users size={18} />
          </div>
          <div>
            <p>Total ballots</p>
            <h3>{totalVotes}</h3>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">
            <VoteIcon size={18} />
          </div>
          <div>
            <p>Active candidates</p>
            <h3>{results.length}</h3>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">
            <Medal size={18} />
          </div>
          <div>
            <p>Lead margin</p>
            <h3>
              {leader ? leader.votes - (sortedResults[1]?.votes || 0) : 0}
            </h3>
          </div>
        </div>
      </div>

      <div className="card results-hero">
        <div>
          <h2>
            Leading candidate
          </h2>
          <p>
            Updated with every confirmed vote.
          </p>
        </div>
        <div className="results-leader">
          <Trophy size={18} />
          {leader ? `${leader.symbol} ${leader.name}` : "No leader yet"}
        </div>
      </div>

      {isLoading && (
        <div className="results-loading">
          <div className="loading-bar" />
          <div className="loading-bar" />
          <div className="loading-bar" />
        </div>
      )}

      {isEmpty && (
        <div className="card results-empty">
          <h3>No votes recorded</h3>
          <p>
            Results will appear once the first ballot is confirmed.
          </p>
        </div>
      )}

      {!isLoading && !isEmpty && (
        <div className="results-grid">
          {sortedResults.map((candidate, index) => {
            const percent = totalVotes
              ? Math.round((candidate.votes / totalVotes) * 100)
              : 0;

            return (
              <div className="card results-card" key={candidate.id}>
                <div className="results-card-header">
                  <div className="rank-badge">#{index + 1}</div>
                  <div>
                    <h3>
                      {candidate.symbol} {candidate.name}
                    </h3>
                    <p>{candidate.party}</p>
                  </div>
                  <div className="results-stat">
                    <span>{percent}%</span>
                    <small>{candidate.votes} votes</small>
                  </div>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-bar"
                    style={{
                      width: `${percent}%`
                    }}
                  />
                </div>
                <div className="results-meta">
                  <TrendingUp size={16} />
                  Vote share distribution
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ResultsPage;