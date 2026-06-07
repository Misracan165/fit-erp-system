import { useEffect, useState } from "react";
import StatCard from "../components/StatCard";

function Dashboard() {
  const [members, setMembers] = useState([]);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    membership_type: "",
    start_date: "",
  });
  
  const [editingId, setEditingId] = useState(null);

  const fetchMembers = () => {
    fetch("http://localhost:5000/members")
      .then((res) => res.json())
      .then((data) => {
        setMembers(data);
      });
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

  fetchMembers();
};

  const deleteMember = async (id) => {
  await fetch(`http://localhost:5000/members/${id}`, {
    method: "DELETE",
  });

  fetchMembers();
};

  const editMember = (member) => {
  setFormData({
    full_name: member.full_name,
    email: member.email,
    phone: member.phone,
    membership_type: member.membership_type,
    start_date: member.start_date?.split("T")[0] || "",
  });

  setEditingId(member.id);
};

  return (
    <div>
      <h1>Dashboard</h1>

      <div className="card-container">
        <StatCard title="Toplam Üye" value={members.length} />
        <StatCard title="Eğitmen Sayısı" value="8" />
        <StatCard title="Aktif Abonelik" value="95" />
        <StatCard title="Aylık Gelir" value="₺45.000" />
      </div>

      <div className="form-container">
        <h2>Yeni Üye Ekle</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="full_name"
            placeholder="Ad Soyad"
            value={formData.full_name}
            onChange={handleChange}
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
          />

          <input
            type="text"
            name="phone"
            placeholder="Telefon"
            value={formData.phone}
            onChange={handleChange}
          />

          <input
            type="text"
            name="membership_type"
            placeholder="Üyelik Türü"
            value={formData.membership_type}
            onChange={handleChange}
          />

          <input
            type="date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
          />

          <button type="submit">
  {editingId ? "Üye Güncelle" : "Üye Ekle"}
</button>
        </form>
      </div>

      <h2 style={{ marginTop: "40px" }}>Üyeler</h2>

      {members.map((member) => (
       <div key={member.id} className="member-card">
         <p><strong>Ad:</strong> {member.full_name}</p>
         <p><strong>Üyelik:</strong> {member.membership_type}</p>
         <button
  onClick={() => editMember(member)}
>
  Düzenle
</button>
         <button
           className="delete-btn"
           onClick={() => deleteMember(member.id)}
         >
           Üyeyi Sil
         </button>
        </div>
      ))}
    </div>
  ); 
}

export default Dashboard;