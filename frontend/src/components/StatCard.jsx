function StatCard({ title, value, icon }) {
  const getIcon = () => {
    switch (icon) {
      case "users":
        return <span className="stat-icon icon-users">👥</span>;
      case "trainers":
        return <span className="stat-icon icon-trainers">💪</span>;
      case "payments":
        return <span className="stat-icon icon-payments">💳</span>;
      case "revenue":
        return <span className="stat-icon icon-revenue">💰</span>;
      default:
        return null;
    }
  };

  return (
    <div className="stat-card">
      <div className="stat-card-content">
        <h3>{title}</h3>
        <p className="stat-value">{value}</p>
      </div>
      {getIcon()}
    </div>
  );
}

export default StatCard;