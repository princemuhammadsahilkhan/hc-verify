import React from 'react';
import { Activity } from 'lucide-react';

function QRScanner() {
  return (
    <div className="card admin-panel" style={{ marginTop: 16 }}>
      <div className="card-header">
        <div>
          <h2 className="card-title"><Activity size={16} /> QR Scanner</h2>
          <p className="card-subtitle">Module for QR Scanner.</p>
        </div>
      </div>
      <div className="empty-state" style={{ marginTop: 16 }}>
        <h3>Access Granted</h3>
        <p>You have access to the QR Scanner module.</p>
      </div>
    </div>
  );
}

export default QRScanner;
