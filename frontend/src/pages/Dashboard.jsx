import StatCard from "../components/StatCard";

function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>

      <div className="card-container">
        <StatCard title="Toplam Üye" value="120" />
        <StatCard title="Eğitmen Sayısı" value="8" />
        <StatCard title="Aktif Abonelik" value="95" />
        <StatCard title="Aylık Gelir" value="₺45.000" />
      </div>
    </div>
  );
}

export default Dashboard;