import React from 'react';
import { Activity } from 'lucide-react';

function RestartServices() {
  return (
    <div className="card admin-panel" style={{ marginTop: 16 }}>
      <div className="card-header">
        <div>
          <h2 className="card-title"><Activity size={16} /> Restart Services</h2>
          <p className="card-subtitle">Module for Restart Services.</p>
        </div>
      </div>
      <div className="empty-state" style={{ marginTop: 16 }}>
        <h3>Access Granted</h3>
        <p>You have access to the Restart Services module.</p>
      </div>
    </div>
  );
}

export default RestartServices;
