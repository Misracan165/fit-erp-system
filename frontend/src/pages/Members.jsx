import { useEffect, useState } from "react";

function Members() {
  const [members, setMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("");
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    membership_type: "",
    start_date: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const fetchMembers = () => {
    fetch("http://localhost:5000/members")
      .then((res) => res.json())
      .then((data) => {
        setMembers(data);
      })
      .catch((err) => console.error("Üyeler yüklenirken hata oluştu:", err));
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.full_name.trim()) {
      alert("Lütfen ad soyad giriniz.");
      return;
    }

    try {
      if (editingId) {
        await fetch(`http://localhost:5000/members/${editingId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });
      } else {
        await fetch("http://localhost:5000/members", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });
      }

      setFormData({
        full_name: "",
        email: "",
        phone: "",
        membership_type: "",
        start_date: "",
      });
      setEditingId(null);
      setShowForm(false);
      fetchMembers();
    } catch (err) {
      console.error("Kaydetme işlemi sırasında hata oluştu:", err);
    }
  };

  const deleteMember = async (id) => {
    if (window.confirm("Bu üyeyi silmek istediğinize emin misiniz?")) {
      try {
        await fetch(`http://localhost:5000/members/${id}`, {
          method: "DELETE",
        });
        fetchMembers();
      } catch (err) {
        console.error("Silme işlemi sırasında hata oluştu:", err);
      }
    }
  };

  const editMember = (member) => {
    setFormData({
      full_name: member.full_name || "",
      email: member.email || "",
      phone: member.phone || "",
      membership_type: member.membership_type || "",
      start_date: member.start_date ? member.start_date.split("T")[0] : "",
    });
    setEditingId(member.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setFormData({
      full_name: "",
      email: "",
      phone: "",
      membership_type: "",
      start_date: "",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const filteredMembers = members.filter((member) => {
    const fullName = member.full_name || "";
    const email = member.email || "";
    const phone = member.phone || "";
    const type = member.membership_type || "";

    const matchesSearch =
      fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phone.includes(searchQuery);

    const matchesFilter = filterType === "" || type === filterType;

    return matchesSearch && matchesFilter;
  });

  const getUniqueTypes = () => {
    const types = members.map((m) => m.membership_type).filter(Boolean);
    return [...new Set(types)];
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("tr-TR");
  };

  return (
    <div className="members-page animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Üye Yönetimi</h1>
          <p className="subtitle">Spor salonundaki tüm aktif ve pasif üyeleri yönetin</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); if(showForm) handleCancel(); }}>
          {showForm ? "Formu Kapat" : "Yeni Üye Ekle"}
        </button>
      </div>

      {showForm && (
        <div className="form-card animate-slide-down">
          <h2>{editingId ? "Üye Bilgilerini Güncelle" : "Yeni Üye Kaydı Oluştur"}</h2>
          <form onSubmit={handleSubmit} className="modern-form">
            <div className="form-grid">
              <div className="form-group">
                <label>Ad Soyad *</label>
                <input
                  type="text"
                  name="full_name"
                  placeholder="Ahmet Yılmaz"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>E-posta Adresi</label>
                <input
                  type="email"
                  name="email"
                  placeholder="ahmet@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Telefon Numarası</label>
                <input
                  type="text"
                  name="phone"
                  placeholder="0555 123 45 67"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Üyelik Paketi</label>
                <select
                  name="membership_type"
                  value={formData.membership_type}
                  onChange={handleChange}
                >
                  <option value="">Seçiniz...</option>
                  <option value="Standart">Standart</option>
                  <option value="Premium">Premium</option>
                  <option value="VIP">VIP</option>
                  <option value="Öğrenci">Öğrenci</option>
                </select>
              </div>

              <div className="form-group">
                <label>Başlangıç Tarihi</label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                İptal Et
              </button>
              <button type="submit" className="btn btn-primary">
                {editingId ? "Güncellemeleri Kaydet" : "Üye Kaydını Tamamla"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-controls animate-fade-in">
        <div className="search-box">
          <input
            type="text"
            placeholder="İsim, e-posta veya telefon ile ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-box">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">Tüm Üyelik Tipleri</option>
            {getUniqueTypes().map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-container animate-fade-in">
        {filteredMembers.length > 0 ? (
          <table className="modern-table">
            <thead>
              <tr>
                <th>Ad Soyad</th>
                <th>E-posta</th>
                <th>Telefon</th>
                <th>Üyelik Tipi</th>
                <th>Başlangıç Tarihi</th>
                <th className="actions-header">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => (
                <tr key={member.id}>
                  <td>
                    <div className="member-name-cell">
                      <div className="avatar">
                        {member.full_name ? member.full_name.charAt(0).toUpperCase() : "U"}
                      </div>
                      <span className="name">{member.full_name}</span>
                    </div>
                  </td>
                  <td>{member.email || "-"}</td>
                  <td>{member.phone || "-"}</td>
                  <td>
                    <span className={`badge badge-${(member.membership_type || "default").toLowerCase()}`}>
                      {member.membership_type || "Belirtilmemiş"}
                    </span>
                  </td>
                  <td>{formatDate(member.start_date)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-icon btn-edit"
                        onClick={() => editMember(member)}
                        title="Düzenle"
                      >
                        Düzenle
                      </button>
                      <button
                        className="btn btn-icon btn-delete"
                        onClick={() => deleteMember(member.id)}
                        title="Sil"
                      >
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <p>Aranan kriterlere uygun üye bulunamadı.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Members;