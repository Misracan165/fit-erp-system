import { useEffect, useState } from "react";

const PACKAGE_COLORS = [
  { gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", badge: "#667eea" },
  { gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", badge: "#f5576c" },
  { gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", badge: "#4facfe" },
  { gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)", badge: "#43e97b" },
];

function Packages() {
  const [packages, setPackages] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    duration_months: "",
    price: "",
    description: "",
  });

  const fetchPackages = () => {
    fetch("http://localhost:5000/packages")
      .then((r) => r.json())
      .then(setPackages)
      .catch(console.error);
  };

  useEffect(() => { fetchPackages(); }, []);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const url = editingId
      ? `http://localhost:5000/packages/${editingId}`
      : "http://localhost:5000/packages";
    const method = editingId ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    resetForm();
    fetchPackages();
  };

  const handleEdit = (pkg) => {
    setFormData({
      name: pkg.name,
      duration_months: pkg.duration_months,
      price: pkg.price,
      description: pkg.description || "",
    });
    setEditingId(pkg.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bu paketi silmek istediğinize emin misiniz?")) return;
    await fetch(`http://localhost:5000/packages/${id}`, { method: "DELETE" });
    fetchPackages();
  };

  const resetForm = () => {
    setFormData({ name: "", duration_months: "", price: "", description: "" });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Paket Yönetimi</h1>
          <p className="subtitle">Spor salonu üyelik paketlerini tanımlayın ve düzenleyin</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}>
          {showForm ? "Formu Kapat" : "Yeni Paket Oluştur"}
        </button>
      </div>

      {showForm && (
        <div className="form-card animate-slide-down">
          <h2>{editingId ? "Paket Bilgilerini Güncelle" : "Yeni Üyelik Paketi Oluştur"}</h2>
          <form onSubmit={handleSubmit} className="modern-form">
            <div className="form-grid">
              <div className="form-group">
                <label>Paket Adı *</label>
                <input name="name" placeholder="Premium Paket" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Süre (Ay)</label>
                <input name="duration_months" type="number" min="1" placeholder="3" value={formData.duration_months} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Fiyat (₺)</label>
                <input name="price" type="number" min="0" step="0.01" placeholder="999.00" value={formData.price} onChange={handleChange} />
              </div>
              <div className="form-group" style={{ gridColumn: "1/-1" }}>
                <label>Açıklama</label>
                <input name="description" placeholder="Paket içeriği ve avantajları..." value={formData.description} onChange={handleChange} />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={resetForm}>İptal</button>
              <button type="submit" className="btn btn-primary">
                {editingId ? "Paketi Güncelle" : "Paketi Kaydet"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="packages-grid animate-fade-in">
        {packages.map((pkg, idx) => {
          const colorSet = PACKAGE_COLORS[idx % PACKAGE_COLORS.length];
          return (
            <div key={pkg.id} className="package-card">
              <div className="package-header" style={{ background: colorSet.gradient }}>
                <h3 className="package-name">{pkg.name}</h3>
                <div className="package-duration">{pkg.duration_months} Ay</div>
                <div className="package-price">
                  <span className="price-amount">₺{Number(pkg.price).toLocaleString("tr-TR")}</span>
                </div>
              </div>
              <div className="package-body">
                <p className="package-description">{pkg.description || "Açıklama eklenmemiş."}</p>
              </div>
              <div className="package-footer">
                <button className="btn btn-icon btn-edit" onClick={() => handleEdit(pkg)}>Düzenle</button>
                <button className="btn btn-icon btn-delete" onClick={() => handleDelete(pkg.id)}>Sil</button>
              </div>
            </div>
          );
        })}

        {packages.length === 0 && (
          <div className="empty-state">
            <p>Henüz paket tanımlanmamış.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Packages;