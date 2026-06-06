import { useEffect, useState } from "react";
import { BarChart3, ShieldCheck, Users, Vote, AlertTriangle } from "lucide-react";

import API from "../api";
import StatCard from "../components/StatCard";

function PublicBoardPage() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await API.get("/public/stats");
        setStats(response.data);
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, []);

  const verificationStats = stats?.verification_statistics;
  const verificationAvailable = Boolean(verificationStats?.available);

  return (
    <div className="page">
      <div className="page-header">
        <div className="eyebrow">
          <BarChart3 size={16} />
          Public transparency layer
        </div>
        <h1 className="section-title">Public bulletin board</h1>
        <p className="section-subtitle">
          Aggregated election statistics only. No private voter data is shown.
        </p>
      </div>

      <div className="stats-grid">
        {isLoading ? (
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
              value={stats?.total_registered_voters ?? 0}
              icon={<Users size={20} />}
              color="#0f766e"
            />

            <StatCard
              title="Votes cast"
              value={stats?.total_votes_cast ?? 0}
              icon={<Vote size={20} />}
              color="#1d4ed8"
            />

            <StatCard
              title="Election status"
              value={stats?.election_status ?? "Voting Open"}
              icon={<ShieldCheck size={20} />}
              color="#7c3aed"
            />

            <div className="card">
              <div className="card-header">
                <div>
                  <h2 className="card-title">Verification statistics</h2>
                  <p className="card-subtitle">
                    Aggregated biometric verification totals.
                  </p>
                </div>
                <div className="status-badge success">
                  Public data
                </div>
              </div>

              {verificationAvailable ? (
                <div className="system-grid">
                  <div className="system-item">
                    <div className="system-label">
                      <ShieldCheck size={16} />
                      <span>Successful verifications</span>
                    </div>
                    <div className="status-badge success">
                      {verificationStats.successful_verifications}
                    </div>
                  </div>

                  <div className="system-item">
                    <div className="system-label">
                      <AlertTriangle size={16} />
                      <span>Failed verifications</span>
                    </div>
                    <div className="status-badge success">
                      {verificationStats.failed_verifications}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ paddingTop: 8 }}>
                  <p className="section-subtitle">Not Available</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default PublicBoardPage;