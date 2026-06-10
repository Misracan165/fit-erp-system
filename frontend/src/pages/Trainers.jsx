import { useEffect, useState } from "react";

const SPECIALTY_COLORS = {
  "Vücut Geliştirme ve Kuvvet Antrenmanı": { bg: "#eff6ff", color: "#1d4ed8", icon: "🏋️" },
  "Pilates ve Esneklik": { bg: "#fdf4ff", color: "#9333ea", icon: "🧘" },
  "Yoga ve Meditasyon": { bg: "#f0fdf4", color: "#15803d", icon: "🌿" },
  "Kardiyovasküler ve Beslenme": { bg: "#fff7ed", color: "#c2410c", icon: "🏃" },
  "CrossFit ve Fonksiyonel Antrenman": { bg: "#fef2f2", color: "#dc2626", icon: "⚡" },
  "Boks ve Savunma Sanatları": { bg: "#fff1f2", color: "#be123c", icon: "🥊" },
};

function Trainers() {
  const [trainers, setTrainers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ full_name: "", specialty: "", phone: "" });

  const fetchTrainers = () => {
    fetch("http://localhost:5000/trainers")
      .then((r) => r.json())
      .then(setTrainers)
      .catch(console.error);
  };

  useEffect(() => { fetchTrainers(); }, []);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name.trim()) return;

    const url = editingId
      ? `http://localhost:5000/trainers/${editingId}`
      : "http://localhost:5000/trainers";
    const method = editingId ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    resetForm();
    fetchTrainers();
  };

  const handleEdit = (t) => {
    setFormData({ full_name: t.full_name, specialty: t.specialty || "", phone: t.phone || "" });
    setEditingId(t.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bu eğitmeni silmek istediğinize emin misiniz?")) return;
    await fetch(`http://localhost:5000/trainers/${id}`, { method: "DELETE" });
    fetchTrainers();
  };

  const resetForm = () => {
    setFormData({ full_name: "", specialty: "", phone: "" });
    setEditingId(null);
    setShowForm(false);
  };

  const getStyle = (specialty) =>
    SPECIALTY_COLORS[specialty] || { bg: "#f1f5f9", color: "#475569", icon: "💪" };

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Eğitmen Yönetimi</h1>
          <p className="subtitle">Spor salonunuzdaki tüm profesyonel eğitmenleri yönetin</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}>
          {showForm ? "Formu Kapat" : "Yeni Eğitmen Ekle"}
        </button>
      </div>

      {showForm && (
        <div className="form-card animate-slide-down">
          <h2>{editingId ? "Eğitmen Bilgilerini Güncelle" : "Yeni Eğitmen Kaydı"}</h2>
          <form onSubmit={handleSubmit} className="modern-form">
            <div className="form-grid">
              <div className="form-group">
                <label>Ad Soyad *</label>
                <input name="full_name" placeholder="Murat Arslan" value={formData.full_name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Uzmanlık Alanı</label>
                <select name="specialty" value={formData.specialty} onChange={handleChange}>
                  <option value="">Seçiniz...</option>
                  <option>Vücut Geliştirme ve Kuvvet Antrenmanı</option>
                  <option>Pilates ve Esneklik</option>
                  <option>Yoga ve Meditasyon</option>
                  <option>Kardiyovasküler ve Beslenme</option>
                  <option>CrossFit ve Fonksiyonel Antrenman</option>
                  <option>Boks ve Savunma Sanatları</option>
                  <option>Diğer</option>
                </select>
              </div>
              <div className="form-group">
                <label>Telefon</label>
                <input name="phone" placeholder="0555 000 00 00" value={formData.phone} onChange={handleChange} />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={resetForm}>İptal</button>
              <button type="submit" className="btn btn-primary">
                {editingId ? "Güncelle" : "Eğitmen Ekle"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="trainers-grid animate-fade-in">
        {trainers.map((t) => {
          const style = getStyle(t.specialty);
          return (
            <div key={t.id} className="trainer-card">
              <div className="trainer-icon-wrap" style={{ background: style.bg }}>
                <span className="trainer-icon">{style.icon}</span>
              </div>
              <div className="trainer-info">
                <h3>{t.full_name}</h3>
                <span className="trainer-specialty" style={{ background: style.bg, color: style.color }}>
                  {t.specialty || "Belirtilmemiş"}
                </span>
                <p className="trainer-phone">📞 {t.phone || "-"}</p>
              </div>
              <div className="trainer-actions">
                <button className="btn btn-icon btn-edit" onClick={() => handleEdit(t)}>Düzenle</button>
                <button className="btn btn-icon btn-delete" onClick={() => handleDelete(t.id)}>Sil</button>
              </div>
            </div>
          );
        })}

        {trainers.length === 0 && (
          <div className="empty-state">
            <p>Henüz eğitmen kaydı bulunmuyor.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Trainers;