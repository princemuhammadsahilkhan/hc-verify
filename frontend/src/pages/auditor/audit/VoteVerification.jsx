import React from 'react';
import { Activity } from 'lucide-react';

function VoteVerification() {
  return (
    <div className="card admin-panel" style={{ marginTop: 16 }}>
      <div className="card-header">
        <div>
          <h2 className="card-title"><Activity size={16} /> Vote Verification</h2>
          <p className="card-subtitle">Module for Vote Verification.</p>
        </div>
      </div>
      <div className="empty-state" style={{ marginTop: 16 }}>
        <h3>Access Granted</h3>
        <p>You have access to the Vote Verification module.</p>
      </div>
    </div>
  );
}

export default VoteVerification;
