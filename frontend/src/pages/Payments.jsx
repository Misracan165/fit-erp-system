import { useEffect, useState } from "react";

function Payments() {
  const [payments, setPayments] = useState([]);
  const [members, setMembers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    member_id: "",
    amount: "",
    payment_date: "",
  });

  const fetchPayments = () => {
    fetch("http://localhost:5000/payments")
      .then((r) => r.json())
      .then(setPayments)
      .catch(console.error);
  };

  const fetchMembers = () => {
    fetch("http://localhost:5000/members")
      .then((r) => r.json())
      .then(setMembers)
      .catch(console.error);
  };

  useEffect(() => {
    fetchPayments();
    fetchMembers();
  }, []);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.member_id || !formData.amount) return;

    const url = editingId
      ? `http://localhost:5000/payments/${editingId}`
      : "http://localhost:5000/payments";
    const method = editingId ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    resetForm();
    fetchPayments();
  };

  const handleEdit = (p) => {
    setFormData({
      member_id: p.member_id,
      amount: p.amount,
      payment_date: p.payment_date ? p.payment_date.split("T")[0] : "",
    });
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bu ödeme kaydını silmek istediğinize emin misiniz?")) return;
    await fetch(`http://localhost:5000/payments/${id}`, { method: "DELETE" });
    fetchPayments();
  };

  const resetForm = () => {
    setFormData({ member_id: "", amount: "", payment_date: "" });
    setEditingId(null);
    setShowForm(false);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("tr-TR");
  };

  const totalRevenue = payments.reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Ödeme Yönetimi</h1>
          <p className="subtitle">Tüm üye ödemelerini takip edin ve yeni kayıt ekleyin</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}>
          {showForm ? "Formu Kapat" : "Yeni Ödeme Ekle"}
        </button>
      </div>

      {/* KPI */}
      <div className="payments-kpi animate-fade-in">
        <div className="kpi-card">
          <span className="kpi-label">Toplam İşlem</span>
          <span className="kpi-value">{payments.length}</span>
        </div>
        <div className="kpi-card kpi-revenue">
          <span className="kpi-label">Toplam Gelir</span>
          <span className="kpi-value">₺{totalRevenue.toLocaleString("tr-TR")}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Ort. Ödeme</span>
          <span className="kpi-value">
            ₺{payments.length ? Math.round(totalRevenue / payments.length).toLocaleString("tr-TR") : "0"}
          </span>
        </div>
      </div>

      {showForm && (
        <div className="form-card animate-slide-down">
          <h2>{editingId ? "Ödeme Kaydını Düzenle" : "Yeni Ödeme Kaydı Oluştur"}</h2>
          <form onSubmit={handleSubmit} className="modern-form">
            <div className="form-grid">
              <div className="form-group">
                <label>Üye *</label>
                <select name="member_id" value={formData.member_id} onChange={handleChange} required>
                  <option value="">Üye seçiniz...</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} ({m.membership_type || "Belirsiz"})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Tutar (₺) *</label>
                <input name="amount" type="number" min="0" step="0.01" placeholder="999.00" value={formData.amount} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Ödeme Tarihi</label>
                <input name="payment_date" type="date" value={formData.payment_date} onChange={handleChange} />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={resetForm}>İptal</button>
              <button type="submit" className="btn btn-primary">
                {editingId ? "Ödemeyi Güncelle" : "Ödemeyi Kaydet"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-container animate-fade-in">
        {payments.length > 0 ? (
          <table className="modern-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Üye Adı</th>
                <th>Tutar</th>
                <th>Ödeme Tarihi</th>
                <th className="actions-header">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td style={{ color: "var(--text-muted)", fontWeight: 500 }}>#{p.id}</td>
                  <td>
                    <div className="member-name-cell">
                      <div className="avatar">
                        {p.member_name ? p.member_name.charAt(0).toUpperCase() : "?"}
                      </div>
                      <span>{p.member_name || `Üye #${p.member_id}`}</span>
                    </div>
                  </td>
                  <td>
                    <span className="payment-amount positive">
                      ₺{Number(p.amount).toLocaleString("tr-TR")}
                    </span>
                  </td>
                  <td>{formatDate(p.payment_date)}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn btn-icon btn-edit" onClick={() => handleEdit(p)}>Düzenle</button>
                      <button className="btn btn-icon btn-delete" onClick={() => handleDelete(p.id)}>Sil</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <p>Kayıtlı ödeme bulunamadı.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Payments;