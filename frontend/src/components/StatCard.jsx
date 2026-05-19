function StatCard({

  title,
  value,
  icon,
  color

}) {

  return (

    <div
      className="stat-card"
      style={{
        borderTop: `4px solid ${color}`
      }}
    >

      <div className="stat-icon">
        {icon}
      </div>

      <div className="stat-content">

        <div className="stat-value">
          {value}
        </div>

        <p className="stat-label">
          {title}
        </p>

      </div>

    </div>
  );
}

export default StatCard;