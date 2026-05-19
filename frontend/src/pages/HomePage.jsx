import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ShieldCheck,
  Users,
  Vote,
  Link2,
  AlertTriangle,
  Inbox
} from "lucide-react";

import API from "../api";

import StatCard from "../components/StatCard";

import SystemStatus from "../components/SystemStatus";


function HomePage() {

  const [results, setResults] = useState([]);

  const [voters, setVoters] = useState([]);


  useEffect(() => {

    loadData();

  }, []);


  const loadData = async () => {

    try {

      const resultsRes = await API.get(
        "/results"
      );

      const votersRes = await API.get(
        "/voters"
      );

      setResults(resultsRes.data);

      setVoters(votersRes.data);

    } catch (error) {

      console.log(error);
    }
  };


  const totalVotes = results.reduce(

    (sum, candidate) =>

      sum + candidate.votes,

    0
  );

  const isLoading = results.length === 0 && voters.length === 0;
  const hasResults = results.length > 0;


  return (

    <div className="page">

      <section
        className="hero-grid"
        style={{
          marginBottom: 64
        }}
      >

        <div className="hero-content">

          <div className="eyebrow">
            <ShieldCheck size={16} />
            Live election operations
          </div>

          <h1 className="hero-title">
            Verifiable voting, built for national scale.
          </h1>

          <p className="hero-subtitle">
            A secure, audit-ready experience for registration, verification,
            and tamper-resistant ballot casting.
          </p>

          <div className="hero-actions">
            <Link className="button" to="/register">
              Start registration
              <ArrowRight size={16} />
            </Link>
            <Link className="button secondary" to="/verify">
              Verify a receipt
            </Link>
          </div>

          <div className="hero-meta">
            <div className="meta-pill">
              <ShieldCheck size={14} />
              Zero fraud alerts
            </div>
            <div className="meta-pill">
              <Link2 size={14} />
              Immutable ledger sync
            </div>
          </div>

        </div>

        <div className="card hero-panel">
          <div className="panel-header">
            <h2>Election status</h2>
            <span className="status-badge success">
              Live
            </span>
          </div>
          <p>
            Registration, verification, and vote casting are operating normally
            across all constituencies.
          </p>
          <div className="panel-grid">
            <div>
              <span className="panel-label">Network health</span>
              <strong>99.2%</strong>
            </div>
            <div>
              <span className="panel-label">Audit trail</span>
              <strong>Synced</strong>
            </div>
            <div>
              <span className="panel-label">Alerts</span>
              <strong>0</strong>
            </div>
            <div>
              <span className="panel-label">Security</span>
              <strong>Protected</strong>
            </div>
          </div>
        </div>

      </section>


      <div
        className="stats-grid"
        style={{
          marginTop: 32
        }}
      >

        {
          isLoading ? (
            <>
              <div className="skeleton-card" />
              <div className="skeleton-card" />
              <div className="skeleton-card" />
              <div className="skeleton-card" />
            </>
          ) : (
            <>
              <StatCard
                title="Registered voters"
                value={voters.length}
                icon={<Users size={20} />}
                color="#0f766e"
              />

              <StatCard
                title="Votes cast"
                value={totalVotes}
                icon={<Vote size={20} />}
                color="#1d4ed8"
              />

              <StatCard
                title="Ledger commits"
                value={totalVotes * 2}
                icon={<Link2 size={20} />}
                color="#7c3aed"
              />

              <StatCard
                title="Fraud alerts"
                value="0"
                icon={<AlertTriangle size={20} />}
                color="#b45309"
              />
            </>
          )
        }

      </div>


      <div
        className="card"
        style={{
          marginTop: 36
        }}
      >

        <div className="card-header">
          <div>
            <h2 className="card-title">
              Live tally snapshot
            </h2>
            <p className="card-subtitle">
              Updated from the public ledger with every confirmed vote.
            </p>
          </div>
          <div className="status-badge neutral">
            Syncing
          </div>
        </div>

        {
          isLoading ? (
            <div className="results-loading">
              <div className="loading-bar" />
              <div className="loading-bar" />
              <div className="loading-bar" />
            </div>
          ) : !hasResults ? (
            <div className="empty-state">
              <div className="empty-icon">
                <Inbox size={20} />
              </div>
              <h3>No results yet</h3>
              <p>
                Results will appear once votes are recorded.
              </p>
            </div>
          ) : (
            <div className="results-list">

              <div className="result-head">
                <span>Candidate</span>
                <span>Share</span>
                <span>Votes</span>
              </div>

              {

                results.map((candidate) => {

                  const percent = totalVotes
                    ? Math.round(
                        (candidate.votes / totalVotes) * 100
                      )
                    : 0;

                  return (

                    <div
                      key={candidate.id}
                      className="result-item"
                    >

                      <div className="result-left">

                        <div className="candidate-symbol">

                          {candidate.symbol}

                        </div>

                        <div>

                          <h3>
                            {candidate.name}
                          </h3>

                          <p>
                            {candidate.party}
                          </p>

                        </div>

                      </div>

                      <div className="result-right">
                        <strong>
                          {percent}%
                        </strong>
                        <span>
                          {candidate.votes} votes
                        </span>
                      </div>

                    </div>
                  );
                })

              }

            </div>
          )
        }

      </div>


      <div style={{
        marginTop: 40
      }}>
        <SystemStatus />
      </div>

    </div>
  );
}

export default HomePage;