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
    initializePMTables();
  }
});

const initializePMTables = () => {
  const createTeamTable = `
    CREATE TABLE IF NOT EXISTS pm_team (
      id INT AUTO_INCREMENT PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      role VARCHAR(255),
      email VARCHAR(255)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  const createTasksTable = `
    CREATE TABLE IF NOT EXISTS pm_tasks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      start_date DATE,
      duration_days INT DEFAULT 1,
      progress INT DEFAULT 0,
      assignee_id INT,
      dependencies VARCHAR(255),
      FOREIGN KEY (assignee_id) REFERENCES pm_team(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  const createBudgetTable = `
    CREATE TABLE IF NOT EXISTS pm_budget (
      id INT AUTO_INCREMENT PRIMARY KEY,
      type ENUM('income', 'expense') NOT NULL,
      category VARCHAR(255) NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      date DATE,
      description TEXT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  
  db.query(createTeamTable, (err) => {
    if (err) console.error("pm_team tablosu oluşturulurken hata:", err);
    else {
      db.query(createTasksTable, (err) => {
        if (err) console.error("pm_tasks tablosu oluşturulurken hata:", err);
      });
    }
  });
  
  db.query(createBudgetTable, (err) => {
    if (err) console.error("pm_budget tablosu oluşturulurken hata:", err);
  });
};

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
// DATABASE MANAGER ENDPOINTS
// ─────────────────────────────────────────────
app.get("/db/schema", (req, res) => {
  const colsSql = `
    SELECT table_name, column_name, data_type, is_nullable, column_key
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
    ORDER BY table_name, ordinal_position
  `;
  
  const fkSql = `
    SELECT table_name, column_name, referenced_table_name, referenced_column_name
    FROM information_schema.key_column_usage
    WHERE table_schema = DATABASE() AND referenced_table_name IS NOT NULL
  `;
  
  db.query(colsSql, (err, colsResult) => {
    if (err) return res.status(500).json({ error: err.message });
    
    db.query(fkSql, (err, fkResult) => {
      if (err) return res.status(500).json({ error: err.message });
      
      const fkMap = {};
      fkResult.forEach(fk => {
        const tName = fk.TABLE_NAME || fk.table_name;
        const cName = fk.COLUMN_NAME || fk.column_name;
        const refTName = fk.REFERENCED_TABLE_NAME || fk.referenced_table_name;
        const refCName = fk.REFERENCED_COLUMN_NAME || fk.referenced_column_name;
        fkMap[`${tName}.${cName}`] = `${refTName}.${refCName}`;
      });
      
      const schema = {};
      colsResult.forEach(col => {
        const tbl = col.TABLE_NAME || col.table_name;
        const colName = col.COLUMN_NAME || col.column_name;
        const dataType = col.DATA_TYPE || col.data_type;
        const isNullable = col.IS_NULLABLE || col.is_nullable;
        const colKey = col.COLUMN_KEY || col.column_key;
        
        if (!schema[tbl]) {
          schema[tbl] = {
            name: tbl,
            cols: []
          };
        }
        
        const colInfo = {
          name: colName,
          type: dataType.toUpperCase(),
          pk: colKey === 'PRI',
          nn: isNullable === 'NO'
        };
        
        const fkKey = `${tbl}.${colName}`;
        if (fkMap[fkKey]) {
          colInfo.fk = fkMap[fkKey];
        }
        
        schema[tbl].cols.push(colInfo);
      });
      
      res.json(schema);
    });
  });
});

app.get("/db/stats", (req, res) => {
  const tablesSql = `
    SELECT table_name, (data_length + index_length) AS size_bytes
    FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'
  `;
  
  db.query(tablesSql, async (err, tables) => {
    if (err) return res.status(500).json({ error: err.message });
    
    try {
      const stats = [];
      const countRow = (tableName) => {
        return new Promise((resolve) => {
          db.query(`SELECT COUNT(*) AS count FROM \`${tableName}\``, (err, result) => {
            if (err) resolve(0);
            else resolve(result[0].count);
          });
        });
      };
      
      for (const t of tables) {
        const name = t.table_name || t.TABLE_NAME;
        const size = t.size_bytes || t.SIZE_BYTES || 0;
        const rows = await countRow(name);
        stats.push({
          name,
          rows,
          size_bytes: size
        });
      }
      
      res.json(stats);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
});

app.post("/db/query", (req, res) => {
  const { sql } = req.body;
  if (!sql) return res.status(400).json({ error: "Sorgu boş olamaz." });
  
  const start = process.hrtime();
  
  db.query(sql, (err, results, fields) => {
    const diff = process.hrtime(start);
    const timeMs = (diff[0] * 1000 + diff[1] / 1000000).toFixed(2);
    
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    
    const isMutation = !Array.isArray(results);
    
    res.json({
      results,
      fields: fields ? fields.map(f => f.name) : null,
      timeMs,
      isMutation
    });
  });
});

app.get("/db/table/:name", (req, res) => {
  const tableName = req.params.name;
  const checkSql = `
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = DATABASE() AND table_name = ? AND table_type = 'BASE TABLE'
  `;
  
  db.query(checkSql, [tableName], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: "Tablo bulunamadı." });
    
    db.query(`SELECT * FROM \`${tableName}\` LIMIT 100`, (err, rows, fields) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        rows,
        fields: fields ? fields.map(f => f.name) : []
      });
    });
  });
});

// ─────────────────────────────────────────────
// PROJECT MANAGEMENT ENDPOINTS
// ─────────────────────────────────────────────

// TEAM CRUD
app.get("/pm/team", (req, res) => {
  db.query("SELECT * FROM pm_team ORDER BY id DESC", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

app.post("/pm/team", (req, res) => {
  const sql = "INSERT INTO pm_team (full_name, role, email) VALUES (?, ?, ?)";
  const values = [req.body.full_name, req.body.role, req.body.email];
  db.query(sql, values, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Ekip üyesi eklendi", id: result.insertId });
  });
});

app.put("/pm/team/:id", (req, res) => {
  const sql = "UPDATE pm_team SET full_name=?, role=?, email=? WHERE id=?";
  const values = [req.body.full_name, req.body.role, req.body.email, req.params.id];
  db.query(sql, values, (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Ekip üyesi güncellendi" });
  });
});

app.delete("/pm/team/:id", (req, res) => {
  db.query("DELETE FROM pm_team WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Ekip üyesi silindi" });
  });
});

// TASKS CRUD
app.get("/pm/tasks", (req, res) => {
  db.query("SELECT * FROM pm_tasks ORDER BY start_date ASC", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

app.post("/pm/tasks", (req, res) => {
  const sql = "INSERT INTO pm_tasks (name, description, start_date, duration_days, progress, assignee_id, dependencies) VALUES (?, ?, ?, ?, ?, ?, ?)";
  const values = [
    req.body.name,
    req.body.description,
    req.body.start_date || null,
    req.body.duration_days || 1,
    req.body.progress || 0,
    req.body.assignee_id || null,
    req.body.dependencies || ""
  ];
  db.query(sql, values, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Görev eklendi", id: result.insertId });
  });
});

app.put("/pm/tasks/:id", (req, res) => {
  const sql = "UPDATE pm_tasks SET name=?, description=?, start_date=?, duration_days=?, progress=?, assignee_id=?, dependencies=? WHERE id=?";
  const values = [
    req.body.name,
    req.body.description,
    req.body.start_date || null,
    req.body.duration_days || 1,
    req.body.progress || 0,
    req.body.assignee_id || null,
    req.body.dependencies || "",
    req.params.id
  ];
  db.query(sql, values, (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Görev güncellendi" });
  });
});

app.delete("/pm/tasks/:id", (req, res) => {
  db.query("DELETE FROM pm_tasks WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Görev silindi" });
  });
});

// BUDGET CRUD
app.get("/pm/budget", (req, res) => {
  db.query("SELECT * FROM pm_budget ORDER BY date DESC", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

app.post("/pm/budget", (req, res) => {
  const sql = "INSERT INTO pm_budget (type, category, amount, date, description) VALUES (?, ?, ?, ?, ?)";
  const values = [
    req.body.type,
    req.body.category,
    req.body.amount,
    req.body.date || null,
    req.body.description
  ];
  db.query(sql, values, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Bütçe hareketi eklendi", id: result.insertId });
  });
});

app.put("/pm/budget/:id", (req, res) => {
  const sql = "UPDATE pm_budget SET type=?, category=?, amount=?, date=?, description=? WHERE id=?";
  const values = [
    req.body.type,
    req.body.category,
    req.body.amount,
    req.body.date || null,
    req.body.description,
    req.params.id
  ];
  db.query(sql, values, (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Bütçe hareketi güncellendi" });
  });
});

app.delete("/pm/budget/:id", (req, res) => {
  db.query("DELETE FROM pm_budget WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Bütçe hareketi silindi" });
  });
});

// ─────────────────────────────────────────────
// DATABASE MANAGER API
// ─────────────────────────────────────────────

// Veritabanındaki tabloların şema bilgisini döndür
app.get("/db/schema", (req, res) => {
  // Önce tüm tabloları çek
  db.query("SHOW TABLES", (err, tables) => {
    if (err) return res.status(500).json({ error: err.message });

    const tableNames = tables.map((row) => Object.values(row)[0]);
    const schema = {};
    let pending = tableNames.length;

    if (pending === 0) return res.json({});

    tableNames.forEach((tableName) => {
      db.query(`DESCRIBE \`${tableName}\``, (err2, columns) => {
        if (!err2 && columns) {
          schema[tableName] = columns.map((col) => ({
            name: col.Field,
            type: col.Type,
            nullable: col.Null === "YES",
            key: col.Key,
            default: col.Default,
            extra: col.Extra,
          }));
        }
        pending--;
        if (pending === 0) res.json(schema);
      });
    });
  });
});

// Her tablo için satır sayısı ve yaklaşık boyut istatistiği
app.get("/db/stats", (req, res) => {
  const sql = `
    SELECT 
      TABLE_NAME AS name,
      TABLE_ROWS AS rows,
      (DATA_LENGTH + INDEX_LENGTH) AS size_bytes
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = ?
    ORDER BY TABLE_NAME
  `;
  db.query(sql, [process.env.DB_NAME || "fiterp_db"], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
});

// Belirli bir tablonun tüm satırlarını döndür
app.get("/db/table/:name", (req, res) => {
  const tableName = req.params.name.replace(/[^a-zA-Z0-9_]/g, ""); // Güvenlik
  const limit = Math.min(parseInt(req.query.limit) || 500, 2000);
  const offset = parseInt(req.query.offset) || 0;

  db.query(`DESCRIBE \`${tableName}\``, (err, cols) => {
    if (err) return res.status(400).json({ error: `Tablo bulunamadı: ${tableName}` });
    const fields = cols.map((c) => c.Field);

    db.query(
      `SELECT * FROM \`${tableName}\` LIMIT ? OFFSET ?`,
      [limit, offset],
      (err2, rows) => {
        if (err2) return res.status(500).json({ error: err2.message });
        res.json({ rows, fields });
      }
    );
  });
});

// Serbest SQL sorgusunu çalıştır ve sonuçları döndür
app.post("/db/query", (req, res) => {
  const { sql } = req.body;
  if (!sql || !sql.trim()) {
    return res.status(400).json({ error: "SQL sorgusu boş olamaz." });
  }

  const t0 = Date.now();

  // Tehlikeli DDL ifadelerini engelle (DROP DATABASE, TRUNCATE vb.)
  const upperSql = sql.trim().toUpperCase();
  if (upperSql.startsWith("DROP DATABASE") || upperSql.startsWith("DROP SCHEMA")) {
    return res.status(403).json({ error: "DROP DATABASE / SCHEMA komutuna izin verilmiyor." });
  }

  db.query(sql, (err, result, fields) => {
    const timeMs = (Date.now() - t0).toFixed(2);
    if (err) {
      return res.status(400).json({ error: err.sqlMessage || err.message, timeMs });
    }

    // SELECT sorguları dizi döndürür, DML/DDL ise OkPacket döndürür
    if (Array.isArray(result)) {
      // Field isimlerini ya fields paramından ya da ilk satırın keylerinden çek
      let fieldNames = [];
      if (fields && Array.isArray(fields) && fields.length > 0) {
        fieldNames = fields.map((f) => f.name || f);
      } else if (result.length > 0) {
        fieldNames = Object.keys(result[0]);
      }
      return res.json({
        results: result,
        fields: fieldNames,
        rowCount: result.length,
        timeMs,
        isMutation: false,
      });
    } else {
      return res.json({
        results: [],
        fields: [],
        rowCount: 0,
        affectedRows: result.affectedRows || 0,
        timeMs,
        isMutation: true,
        message: `İşlem başarıyla tamamlandı. Etkilenen satır: ${result.affectedRows || 0}`,
      });
    }
  });
});

// ─────────────────────────────────────────────
// SERVER
// ─────────────────────────────────────────────
app.listen(5000, () => {
  console.log("Server 5000 portunda çalışıyor");
});