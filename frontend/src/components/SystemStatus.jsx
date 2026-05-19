import { Database, ShieldCheck, Server, Link2 } from "lucide-react";

function SystemStatus() {

  const systems = [

    {
      name: "API gateway",
      status: "Running",
      icon: <Server size={16} />
    },

    {
      name: "Ledger RPC",
      status: "Connected",
      icon: <Link2 size={16} />
    },

    {
      name: "Constituency sync",
      status: "5/6 Online",
      icon: <Database size={16} />
    },

    {
      name: "Encryption keys",
      status: "Secure",
      icon: <ShieldCheck size={16} />
    }

  ];

  return (

    <div className="card">

      <div className="card-header">
        <div>
          <h2 className="card-title">
            System health
          </h2>
          <p className="card-subtitle">
            Current operational status across critical services.
          </p>
        </div>
        <div className="status-badge success">Healthy</div>
      </div>

      <div className="system-grid">

        {

          systems.map((item, index) => (

            <div
              key={index}
              className="system-item"
            >

              <div className="system-label">
                {item.icon}
                <span>{item.name}</span>
              </div>

              <div className="status-badge success">
                {item.status}
              </div>

            </div>

          ))

        }

      </div>

    </div>
  );
}

export default SystemStatus;