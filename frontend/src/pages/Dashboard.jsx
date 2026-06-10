import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StatCard from "../components/StatCard";

function Dashboard() {
  const [members, setMembers] = useState([]);
  const [payments, setPayments] = useState([]);

  const fetchMembers = () => {
    fetch("http://localhost:5000/members")
      .then((res) => res.json())
      .then((data) => {
        setMembers(data);
      })
      .catch((err) => console.error("Üyeler yüklenirken hata oluştu:", err));
  };

  const fetchPayments = () => {
    fetch("http://localhost:5000/payments")
      .then((res) => res.json())
      .then((data) => {
        setPayments(data);
      })
      .catch((err) => console.error("Ödemeler yüklenirken hata oluştu:", err));
  };

  useEffect(() => {
    fetchMembers();
    fetchPayments();
  }, []);

  const totalRevenue = payments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0
  );

  // Get recent 5 members
  const recentMembers = [...members]
    .sort((a, b) => b.id - a.id)
    .slice(0, 5);

  // Get recent 5 payments
  const recentPayments = [...payments]
    .sort((a, b) => b.id - a.id)
    .slice(0, 5);

  // Helper to map member ID to name
  const getMemberName = (memberId) => {
    const found = members.find((m) => m.id === memberId);
    return found ? found.full_name : `Üye #${memberId}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("tr-TR");
  };

  return (
    <div className="dashboard-page animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="subtitle">Spor salonunuzun genel durumu ve özet verileri</p>
        </div>
      </div>

      <div className="card-container">
        <StatCard title="Toplam Üye" value={members.length} icon="users" />
        <StatCard title="Eğitmen Sayısı" value="8" icon="trainers" />
        <StatCard title="Ödeme Sayısı" value={payments.length} icon="payments" />
        <StatCard title="Toplam Gelir" value={`₺${totalRevenue.toLocaleString("tr-TR")}`} icon="revenue" />
      </div>

      <div className="dashboard-grid">
        {/* Recent Members */}
        <div className="dashboard-card recent-members-card">
          <div className="card-header">
            <h2>Son Kaydolan Üyeler</h2>
            <Link to="/members" className="btn btn-text">
              Tümünü Gör →
            </Link>
          </div>
          <div className="card-body">
            {recentMembers.length > 0 ? (
              <ul className="recent-list">
                {recentMembers.map((member) => (
                  <li key={member.id} className="recent-item">
                    <div className="item-left">
                      <div className="avatar">
                        {member.full_name ? member.full_name.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div className="item-info">
                        <span className="item-title">{member.full_name}</span>
                        <span className="item-subtitle">{member.membership_type || "Standart"}</span>
                      </div>
                    </div>
                    <span className="item-date">{formatDate(member.start_date)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-text">Kayıtlı üye bulunmuyor.</p>
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="dashboard-card recent-payments-card">
          <div className="card-header">
            <h2>Son Ödemeler</h2>
            <Link to="/payments" className="btn btn-text">
              Tümünü Gör →
            </Link>
          </div>
          <div className="card-body">
            {recentPayments.length > 0 ? (
              <ul className="recent-list">
                {recentPayments.map((payment) => (
                  <li key={payment.id} className="recent-item">
                    <div className="item-left">
                      <div className="payment-icon">₺</div>
                      <div className="item-info">
                        <span className="item-title">{getMemberName(payment.member_id)}</span>
                        <span className="item-subtitle">{formatDate(payment.payment_date)}</span>
                      </div>
                    </div>
                    <span className="payment-amount positive">
                      +₺{Number(payment.amount).toLocaleString("tr-TR")}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-text">Kayıtlı ödeme bulunmuyor.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;