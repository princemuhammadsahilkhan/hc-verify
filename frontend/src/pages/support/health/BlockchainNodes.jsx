import React from 'react';
import { Activity } from 'lucide-react';

function BlockchainNodes() {
  return (
    <div className="card admin-panel" style={{ marginTop: 16 }}>
      <div className="card-header">
        <div>
          <h2 className="card-title"><Activity size={16} /> Blockchain Nodes</h2>
          <p className="card-subtitle">Module for Blockchain Nodes.</p>
        </div>
      </div>
      <div className="empty-state" style={{ marginTop: 16 }}>
        <h3>Access Granted</h3>
        <p>You have access to the Blockchain Nodes module.</p>
      </div>
    </div>
  );
}

export default BlockchainNodes;
