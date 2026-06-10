const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "root123",
  database: "fiterp_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

db.getConnection((err, connection) => {
  if (err) {
    console.error("Database bağlantı hatası:", err);
  } else {
    console.log("MySQL bağlantısı başarılı (Havuz oluşturuldu)");
    connection.release();
  }
});

// ─────────────────────────────────────────────
// GENEL
// ─────────────────────────────────────────────
app.get("/", (req, res) => {
  res.send("FitERP Backend Çalışıyor");
});

// ─────────────────────────────────────────────
// MEMBERS
// ─────────────────────────────────────────────
app.get("/members", (req, res) => {
  db.query("SELECT * FROM members ORDER BY id DESC", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

app.post("/members", (req, res) => {
  const sql = `INSERT INTO members (full_name, email, phone, membership_type, start_date) VALUES (?, ?, ?, ?, ?)`;
  const values = [
    req.body.full_name,
    req.body.email,
    req.body.phone,
    req.body.membership_type,
    req.body.start_date || null,
  ];
  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Üye ekleme hatası:", err);
      return res.status(500).json(err);
    }
    res.json({ message: "Üye başarıyla eklendi", id: result.insertId });
  });
});

app.put("/members/:id", (req, res) => {
  const sql = `UPDATE members SET full_name=?, email=?, phone=?, membership_type=?, start_date=? WHERE id=?`;
  const values = [
    req.body.full_name,
    req.body.email,
    req.body.phone,
    req.body.membership_type,
    req.body.start_date || null,
    req.params.id,
  ];
  db.query(sql, values, (err) => {
    if (err) {
      console.error("Üye güncelleme hatası:", err);
      return res.status(500).json(err);
    }
    res.json({ message: "Üye güncellendi" });
  });
});

app.delete("/members/:id", (req, res) => {
  db.query("DELETE FROM members WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Üye silindi" });
  });
});

// ─────────────────────────────────────────────
// TRAINERS
// ─────────────────────────────────────────────
app.get("/trainers", (req, res) => {
  db.query("SELECT * FROM trainers ORDER BY id ASC", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

app.post("/trainers", (req, res) => {
  const sql = `INSERT INTO trainers (full_name, specialty, phone) VALUES (?, ?, ?)`;
  const values = [req.body.full_name, req.body.specialty, req.body.phone];
  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Eğitmen ekleme hatası:", err);
      return res.status(500).json(err);
    }
    res.json({ message: "Eğitmen eklendi", id: result.insertId });
  });
});

app.put("/trainers/:id", (req, res) => {
  const sql = `UPDATE trainers SET full_name=?, specialty=?, phone=? WHERE id=?`;
  const values = [req.body.full_name, req.body.specialty, req.body.phone, req.params.id];
  db.query(sql, values, (err) => {
    if (err) {
      console.error("Eğitmen güncelleme hatası:", err);
      return res.status(500).json(err);
    }
    res.json({ message: "Eğitmen güncellendi" });
  });
});

app.delete("/trainers/:id", (req, res) => {
  db.query("DELETE FROM trainers WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Eğitmen silindi" });
  });
});

// ─────────────────────────────────────────────
// PACKAGES
// ─────────────────────────────────────────────
app.get("/packages", (req, res) => {
  db.query("SELECT * FROM packages ORDER BY price ASC", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

app.post("/packages", (req, res) => {
  const sql = `INSERT INTO packages (name, duration_months, price, description, created_at) VALUES (?, ?, ?, ?, ?)`;
  const values = [
    req.body.name,
    req.body.duration_months,
    req.body.price,
    req.body.description,
    req.body.created_at || null,
  ];
  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Paket ekleme hatası:", err);
      return res.status(500).json(err);
    }
    res.json({ message: "Paket eklendi", id: result.insertId });
  });
});

app.put("/packages/:id", (req, res) => {
  const sql = `UPDATE packages SET name=?, duration_months=?, price=?, description=? WHERE id=?`;
  const values = [
    req.body.name,
    req.body.duration_months,
    req.body.price,
    req.body.description,
    req.params.id,
  ];
  db.query(sql, values, (err) => {
    if (err) {
      console.error("Paket güncelleme hatası:", err);
      return res.status(500).json(err);
    }
    res.json({ message: "Paket güncellendi" });
  });
});

app.delete("/packages/:id", (req, res) => {
  db.query("DELETE FROM packages WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Paket silindi" });
  });
});

// ─────────────────────────────────────────────
// PAYMENTS
// ─────────────────────────────────────────────
app.get("/payments", (req, res) => {
  const sql = `
    SELECT p.*, m.full_name AS member_name
    FROM payments p
    LEFT JOIN members m ON p.member_id = m.id
    ORDER BY p.payment_date DESC
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

app.post("/payments", (req, res) => {
  const sql = `INSERT INTO payments (member_id, amount, payment_date) VALUES (?, ?, ?)`;
  const values = [
    req.body.member_id,
    req.body.amount,
    req.body.payment_date || null,
  ];
  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Ödeme ekleme hatası:", err);
      return res.status(500).json(err);
    }
    res.json({ message: "Ödeme kaydedildi", id: result.insertId });
  });
});

app.put("/payments/:id", (req, res) => {
  const sql = `UPDATE payments SET member_id=?, amount=?, payment_date=? WHERE id=?`;
  const values = [
    req.body.member_id,
    req.body.amount,
    req.body.payment_date || null,
    req.params.id,
  ];
  db.query(sql, values, (err) => {
    if (err) {
      console.error("Ödeme güncelleme hatası:", err);
      return res.status(500).json(err);
    }
    res.json({ message: "Ödeme güncellendi" });
  });
});

app.delete("/payments/:id", (req, res) => {
  db.query("DELETE FROM payments WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Ödeme silindi" });
  });
});

// ─────────────────────────────────────────────
// SERVER
// ─────────────────────────────────────────────
app.listen(5000, () => {
  console.log("Server 5000 portunda çalışıyor");
});