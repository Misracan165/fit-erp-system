const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root123",
  database: "fiterp_db",
});

db.connect((err) => {
  if (err) {
    console.log("Database bağlantı hatası");
  } else {
    console.log("MySQL bağlantısı başarılı");
  }
});

app.get("/", (req, res) => {
  res.send("FitERP Backend Çalışıyor");
});

app.get("/members", (req, res) => {
  const sql = "SELECT * FROM members";

  db.query(sql, (err, result) => {
    if (err) {
      res.status(500).json(err);
    } else {
      res.json(result);
    }
  });
});

app.post("/members", (req, res) => {
  const sql = `
    INSERT INTO members 
    (full_name, email, phone, membership_type, start_date)
    VALUES (?, ?, ?, ?, ?)
  `;

  const values = [
    req.body.full_name,
    req.body.email,
    req.body.phone,
    req.body.membership_type,
    req.body.start_date,
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }

    return res.json({
      message: "Üye başarıyla eklendi",
    });
  });
});

app.delete("/members/:id", (req, res) => {
  const sql = "DELETE FROM members WHERE id = ?";

  db.query(sql, [req.params.id], (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }

    return res.json({
      message: "Üye silindi",
    });
  });
});

app.put("/members/:id", (req, res) => {
  const sql = `
    UPDATE members
    SET
      full_name = ?,
      email = ?,
      phone = ?,
      membership_type = ?,
      start_date = ?
    WHERE id = ?
  `;

  const values = [
    req.body.full_name,
    req.body.email,
    req.body.phone,
    req.body.membership_type,
    req.body.start_date,
    req.params.id,
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }

    res.json({
      message: "Üye güncellendi",
    });
  });
});

app.listen(5000, () => {
  console.log("Server 5000 portunda çalışıyor");
});