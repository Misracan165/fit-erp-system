import { useEffect, useState, useRef } from "react";

const DEFAULT_QUERIES = [
  {
    id: 1,
    name: "Üye Başına Toplam Ödeme Raporu",
    description: "Her üyenin yaptığı toplam ödeme sayısı ve tutarı",
    category: "finance",
    pinned: true,
    sql: `SELECT m.id, m.full_name AS Uye, m.membership_type AS Paket, COUNT(p.id) AS Odeme_Sayisi, IFNULL(SUM(p.amount), 0) AS Toplam_Odeme\nFROM members m\nLEFT JOIN payments p ON m.id = p.member_id\nGROUP BY m.id, m.full_name, m.membership_type\nORDER BY Toplam_Odeme DESC;`
  },
  {
    id: 2,
    name: "Paket Tercih Dağılımı",
    description: "Üyelerin hangi paketleri tercih ettiğinin yüzdesel analizi",
    category: "members",
    pinned: true,
    sql: `SELECT membership_type AS Paket, COUNT(*) AS Uye_Sayisi, ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM members), 1) AS Oran_Yuzde\nFROM members\nWHERE membership_type IS NOT NULL AND membership_type != ''\nGROUP BY membership_type\nORDER BY Uye_Sayisi DESC;`
  },
  {
    id: 3,
    name: "Aylık Ciro Raporu",
    description: "Aylara göre toplam spor salonu geliri",
    category: "finance",
    pinned: true,
    sql: `SELECT DATE_FORMAT(payment_date, '%Y-%m') AS Ay, COUNT(id) AS Islem_Sayisi, SUM(amount) AS Toplam_Ciro\nFROM payments\nGROUP BY DATE_FORMAT(payment_date, '%Y-%m')\nORDER BY Ay DESC;`
  },
  {
    id: 4,
    name: "Eğitmen Telefon Rehberi",
    description: "Tüm eğitmenler ve uzmanlık alanları telefon rehberi listesi",
    category: "trainers",
    pinned: false,
    sql: `SELECT full_name AS Egitmen, specialty AS Uzmanlik, phone AS Telefon\nFROM trainers\nORDER BY full_name;`
  },
  {
    id: 5,
    name: "Son 10 Ödeme Detayı",
    description: "En son yapılan 10 ödeme işlemi ve üye bilgisi",
    category: "finance",
    pinned: false,
    sql: `SELECT p.id, m.full_name AS Uye, p.amount AS Tutar, DATE_FORMAT(p.payment_date, '%d-%m-%Y') AS Tarih\nFROM payments p\nLEFT JOIN members m ON p.member_id = m.id\nORDER BY p.payment_date DESC\nLIMIT 10;`
  }
];

function DatabaseManager() {
  const [schema, setSchema] = useState({});
  const [stats, setStats] = useState([]);
  const [activeTab, setActiveTab] = useState("schema"); // schema, editor, saved, browse
  const [selectedTable, setSelectedTable] = useState(null);
  const [browseData, setBrowseData] = useState({ rows: [], fields: [] });
  const [browseSearch, setBrowseSearch] = useState("");
  const [sqlQuery, setSqlQuery] = useState("");
  const [queryResult, setQueryResult] = useState(null); // { results, fields, timeMs, error, isMutation }
  const [executing, setExecuting] = useState(false);
  const [savedQueries, setSavedQueries] = useState([]);
  const [toast, setToast] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // add, edit
  const [modalData, setModalData] = useState({ id: null, name: "", description: "", category: "general", sql: "", pinned: false });

  const sqlEditorRef = useRef(null);
  const lineNumsRef = useRef(null);

  // Load schema and stats
  const fetchData = async () => {
    try {
      const schemaRes = await fetch("http://localhost:5000/db/schema");
      const schemaData = await schemaRes.json();
      setSchema(schemaData);

      const statsRes = await fetch("http://localhost:5000/db/stats");
      const statsData = await statsRes.json();
      setStats(statsData);

      // Set default selected table if any exists
      const tableNames = Object.keys(schemaData);
      if (tableNames.length > 0 && !selectedTable) {
        setSelectedTable(tableNames[0]);
      }
    } catch (err) {
      showToast("Veritabanı bilgileri yüklenemedi. Backend sunucunuz çalışıyor mu?", "error");
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();

    // Initialize Saved Queries from localStorage
    const local = localStorage.getItem("fiterp_saved_queries");
    if (local) {
      setSavedQueries(JSON.parse(local));
    } else {
      setSavedQueries(DEFAULT_QUERIES);
      localStorage.setItem("fiterp_saved_queries", JSON.stringify(DEFAULT_QUERIES));
    }
  }, []);

  // Sync line numbers in SQL editor
  const updateLineNums = () => {
    if (!sqlEditorRef.current || !lineNumsRef.current) return;
    const lines = sqlEditorRef.current.value.split("\n");
    const numArr = Array.from({ length: lines.length }, (_, i) => i + 1);
    lineNumsRef.current.innerHTML = numArr.join("<br>");
  };

  useEffect(() => {
    updateLineNums();
  }, [sqlQuery, activeTab]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const handleTableBrowse = async (tableName) => {
    setSelectedTable(tableName);
    setActiveTab("browse");
    try {
      const res = await fetch(`http://localhost:5000/db/table/${tableName}`);
      if (!res.ok) throw new Error("Yükleme hatası");
      const data = await res.json();
      setBrowseData(data);
    } catch (err) {
      showToast(`"${tableName}" verileri yüklenemedi.`, "error");
    }
  };

  const runQuery = async (queryText) => {
    const textToRun = queryText || sqlQuery;
    if (!textToRun.trim()) {
      showToast("Lütfen bir SQL sorgusu yazın.", "error");
      return;
    }

    // Safety checks for mutations
    const upperText = textToRun.toUpperCase().trim();
    if (upperText.includes("DROP") || upperText.includes("TRUNCATE") || 
        (upperText.includes("DELETE") && !upperText.includes("WHERE")) || 
        (upperText.includes("UPDATE") && !upperText.includes("WHERE"))) {
      const confirm = window.confirm("UYARI: Tablo silme/güncelleme işlemleri kalıcı veri kaybına yol açabilir! Devam etmek istediğinize emin misiniz?");
      if (!confirm) return;
    }

    setExecuting(true);
    setQueryResult(null);

    try {
      const res = await fetch("http://localhost:5000/db/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql: textToRun })
      });
      const data = await res.json();

      if (!res.ok) {
        setQueryResult({ error: data.error || "Bilinmeyen SQL hatası", timeMs: "0.00" });
        showToast("SQL hatası oluştu.", "error");
      } else {
        setQueryResult(data);
        showToast("Sorgu başarıyla çalıştırıldı.");
        // Refresh schema and stats in case table structure or size changed
        fetchData();
      }
    } catch (err) {
      setQueryResult({ error: "Sunucu bağlantı hatası oluştu.", timeMs: "0.00" });
      showToast("Bağlantı hatası.", "error");
    } finally {
      setExecuting(false);
    }
  };

  // Keyboard shortcut F5 to run query
  const handleKey = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newValue = sqlQuery.substring(0, start) + "  " + sqlQuery.substring(end);
      setSqlQuery(newValue);
      setTimeout(() => {
        if (sqlEditorRef.current) {
          sqlEditorRef.current.selectionStart = sqlEditorRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
    if (e.key === "F5") {
      e.preventDefault();
      runQuery();
    }
  };

  const clearEditor = () => {
    setSqlQuery("");
    setQueryResult(null);
    showToast("Editör temizlendi.", "info");
  };

  const loadSnippet = (snippet) => {
    setSqlQuery(snippet);
    setActiveTab("editor");
    showToast("Şablon editöre yüklendi. Çalıştırmak için F5 veya Çalıştır butonuna basın.", "info");
  };

  const formatSQL = () => {
    let formatted = sqlQuery;
    const keywords = [
      "SELECT", "FROM", "WHERE", "JOIN", "LEFT JOIN", "RIGHT JOIN", "INNER JOIN", 
      "GROUP BY", "ORDER BY", "HAVING", "LIMIT", "INSERT INTO", "VALUES", 
      "UPDATE", "SET", "DELETE FROM", "AND", "OR", "ON", "COUNT", "SUM", "AVG", "ROUND"
    ];
    keywords.forEach(kw => {
      const regex = new RegExp(`\\b${kw}\\b`, "gi");
      formatted = formatted.replace(regex, kw);
    });
    setSqlQuery(formatted);
    showToast("Anahtar kelimeler büyük harfe dönüştürüldü.", "info");
  };

  // Saved Queries CRUD
  const saveSavedQueries = (newList) => {
    setSavedQueries(newList);
    localStorage.setItem("fiterp_saved_queries", JSON.stringify(newList));
  };

  const openAddModal = () => {
    setModalMode("add");
    setModalData({
      id: null,
      name: "",
      description: "",
      category: "general",
      sql: sqlQuery,
      pinned: false
    });
    setModalOpen(true);
  };

  const openEditModal = (q) => {
    setModalMode("edit");
    setModalData({ ...q });
    setModalOpen(true);
  };

  const saveQueryModal = () => {
    if (!modalData.name.trim() || !modalData.sql.trim()) {
      alert("Lütfen Sorgu Adı ve SQL Sorgusu alanlarını doldurun.");
      return;
    }

    if (modalMode === "add") {
      const newId = savedQueries.length > 0 ? Math.max(...savedQueries.map(q => q.id)) + 1 : 1;
      const newList = [...savedQueries, { ...modalData, id: newId }];
      saveSavedQueries(newList);
      showToast("Sorgu başarıyla kaydedildi.");
    } else {
      const newList = savedQueries.map(q => q.id === modalData.id ? { ...modalData } : q);
      saveSavedQueries(newList);
      showToast("Sorgu başarıyla güncellendi.");
    }
    setModalOpen(false);
  };

  const deleteSavedQuery = (id, e) => {
    e.stopPropagation();
    if (window.confirm("Bu kayıtlı sorguyu silmek istediğinize emin misiniz?")) {
      const newList = savedQueries.filter(q => q.id !== id);
      saveSavedQueries(newList);
      showToast("Kayıtlı sorgu silindi.", "info");
    }
  };

  // Export functions
  const downloadFile = (content, filename, contentType) => {
    const a = document.createElement("a");
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const exportCSV = (dataRows, dataFields, name) => {
    if (!dataRows || dataRows.length === 0) {
      showToast("Dışa aktarılacak veri yok.", "error");
      return;
    }
    const headers = dataFields.join(",");
    const rows = dataRows.map(row => 
      dataFields.map(field => {
        const val = row[field];
        if (val === null || val === undefined) return "";
        const str = String(val).replace(/"/g, '""');
        return str.includes(",") || str.includes("\n") || str.includes('"') ? `"${str}"` : str;
      }).join(",")
    );
    const csvContent = "\uFEFF" + [headers, ...rows].join("\n"); // UTF-8 BOM
    downloadFile(csvContent, `${name || "export"}_${new Date().toISOString().slice(0, 10)}.csv`, "text/csv;charset=utf-8;");
    showToast("CSV dosyası indirildi.");
  };

  const exportJSON = (dataRows, name) => {
    if (!dataRows || dataRows.length === 0) {
      showToast("Dışa aktarılacak veri yok.", "error");
      return;
    }
    const jsonContent = JSON.stringify(dataRows, null, 2);
    downloadFile(jsonContent, `${name || "export"}_${new Date().toISOString().slice(0, 10)}.json`, "application/json");
    showToast("JSON dosyası indirildi.");
  };

  // Filter browse data locally
  const filteredBrowseRows = browseData.rows.filter(row => {
    if (!browseSearch) return true;
    return browseData.fields.some(field => {
      const val = row[field];
      if (val === null || val === undefined) return false;
      return String(val).toLowerCase().includes(browseSearch.toLowerCase());
    });
  });

  const getTableStats = (tableName) => {
    const s = stats.find(item => item.name === tableName);
    return s ? `${s.rows} satır, ${(s.size_bytes / 1024).toFixed(1)} KB` : "-";
  };

  const getTableIcon = (tableName) => {
    switch (tableName.toLowerCase()) {
      case "members": return "👥";
      case "trainers": return "💪";
      case "packages": return "🏷️";
      case "payments": return "💳";
      default: return "📊";
    }
  };

  return (
    <div className="db-manager-page animate-fade-in">
      <style>{`
        .db-layout {
          display: flex;
          background: #ffffff;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          height: calc(100vh - 180px);
          overflow: hidden;
          box-shadow: var(--shadow-sm);
        }
        .db-sidebar {
          width: 280px;
          border-right: 1px solid var(--border-color);
          background: #f8fafc;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .db-sidebar-header {
          padding: 16px 20px;
          font-weight: 700;
          font-size: 15px;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-dark);
        }
        .db-sidebar-title {
          flex: 1;
        }
        .db-sidebar-list {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
        }
        .db-sidebar-item {
          display: flex;
          align-items: center;
          padding: 10px 12px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          color: #475569;
          margin-bottom: 4px;
          transition: var(--transition);
        }
        .db-sidebar-item:hover {
          background: #f1f5f9;
          color: var(--text-dark);
        }
        .db-sidebar-item.active {
          background: rgba(59, 130, 246, 0.08);
          color: var(--primary-color);
          font-weight: 600;
        }
        .db-sidebar-item-icon {
          font-size: 16px;
          margin-right: 8px;
        }
        .db-sidebar-badge {
          margin-left: auto;
          font-size: 11px;
          background: #e2e8f0;
          color: #64748b;
          padding: 2px 6px;
          border-radius: 10px;
          font-weight: 600;
        }
        .db-sidebar-item.active .db-sidebar-badge {
          background: var(--primary-color);
          color: #ffffff;
        }
        .db-stats-panel {
          padding: 14px 20px;
          border-top: 1px solid var(--border-color);
          background: #f8fafc;
        }
        .db-stats-title {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }
        .db-stats-row {
          font-size: 12px;
          color: #475569;
          line-height: 1.6;
        }

        .db-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: #ffffff;
        }
        .db-topbar {
          padding: 12px 24px;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          gap: 8px;
          background: #ffffff;
        }
        .db-tab-btn {
          padding: 8px 16px;
          border-radius: var(--radius-sm);
          font-size: 13px;
          font-weight: 600;
          color: var(--text-muted);
          cursor: pointer;
          border: none;
          background: transparent;
          transition: var(--transition);
        }
        .db-tab-btn:hover {
          background: #f1f5f9;
          color: var(--text-dark);
        }
        .db-tab-btn.active {
          background: var(--primary-color);
          color: #ffffff;
          box-shadow: 0 4px 10px rgba(59, 130, 246, 0.2);
        }

        .db-content {
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        /* Schema View Styles */
        .db-schema-wrap {
          padding: 24px;
          overflow-y: auto;
          flex: 1;
        }
        .db-schema-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 20px;
        }
        .db-schema-card {
          background: #ffffff;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          overflow: hidden;
          box-shadow: var(--shadow-sm);
          transition: var(--transition);
        }
        .db-schema-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        .db-schema-head {
          padding: 12px 16px;
          background: #f8fafc;
          border-bottom: 1px solid var(--border-color);
          font-weight: 700;
          color: var(--text-dark);
          font-size: 14px;
          display: flex;
          align-items: center;
        }
        .db-schema-title-text {
          flex: 1;
        }
        .db-schema-badge {
          font-size: 10px;
          background: #e2e8f0;
          color: #475569;
          padding: 2px 7px;
          border-radius: 20px;
        }
        .db-schema-cols {
          padding: 8px 0;
        }
        .db-schema-col {
          display: flex;
          align-items: center;
          padding: 6px 16px;
          font-size: 12px;
          color: #334155;
        }
        .db-schema-col:hover {
          background: #f8fafc;
        }
        .db-schema-col-name {
          flex: 1;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .db-schema-col-type {
          color: #64748b;
          font-size: 10px;
          text-transform: uppercase;
        }
        .badge-pk {
          background: #fef3c7;
          color: #b45309;
          font-size: 9px;
          font-weight: 700;
          padding: 1px 4px;
          border-radius: 4px;
        }
        .badge-fk {
          background: #dbeafe;
          color: #1d4ed8;
          font-size: 9px;
          font-weight: 700;
          padding: 1px 4px;
          border-radius: 4px;
          cursor: help;
        }
        .badge-nn {
          background: #dcfce7;
          color: #15803d;
          font-size: 9px;
          font-weight: 700;
          padding: 1px 4px;
          border-radius: 4px;
        }

        /* SQL Editor Styles */
        .db-editor-wrap {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .db-editor-toolbar {
          padding: 10px 24px;
          border-bottom: 1px solid var(--border-color);
          background: #f8fafc;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .db-editor-main {
          flex: 1;
          display: flex;
          overflow: hidden;
        }
        .db-editor-left {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border-right: 1px solid var(--border-color);
        }
        .db-textarea-container {
          position: relative;
          flex: 1;
          display: flex;
          background: #1e293b; /* Premium dark code editor */
          color: #f8fafc;
          font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
          font-size: 13px;
        }
        .db-line-nums {
          width: 45px;
          background: #0f172a;
          color: #475569;
          padding: 16px 8px;
          text-align: right;
          user-select: none;
          line-height: 1.8;
        }
        .db-textarea {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #f8fafc;
          padding: 16px;
          resize: none;
          font-family: inherit;
          font-size: inherit;
          line-height: 1.8;
          tab-size: 2;
        }
        .db-editor-right {
          width: 250px;
          background: #ffffff;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .db-editor-right-title {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        .db-snippet-card {
          background: #f8fafc;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          padding: 10px;
          cursor: pointer;
          transition: var(--transition);
        }
        .db-snippet-card:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }
        .db-snippet-card-title {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-dark);
          margin-bottom: 4px;
        }
        .db-snippet-card-desc {
          font-size: 11px;
          color: var(--text-muted);
          line-height: 1.4;
        }

        .db-results-panel {
          height: 250px;
          border-top: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: #ffffff;
        }
        .db-results-header {
          padding: 10px 24px;
          border-bottom: 1px solid var(--border-color);
          background: #f8fafc;
          display: flex;
          align-items: center;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-dark);
        }
        .db-results-info {
          font-weight: 400;
          color: var(--text-muted);
          font-size: 12px;
          margin-left: 8px;
        }
        .db-results-body {
          flex: 1;
          overflow: auto;
        }
        .db-results-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--text-muted);
          font-size: 13px;
        }
        .db-results-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          text-align: left;
        }
        .db-results-table th {
          background: #f1f5f9;
          padding: 10px 16px;
          font-weight: 600;
          color: #475569;
          border-bottom: 1px solid var(--border-color);
          white-space: nowrap;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .db-results-table td {
          padding: 10px 16px;
          color: #334155;
          border-bottom: 1px solid #e2e8f0;
          white-space: nowrap;
          max-width: 300px;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .db-results-table tbody tr:hover {
          background: #f8fafc;
        }
        .db-results-table td:hover {
          white-space: normal;
          max-width: none;
          overflow: visible;
          background: #ffffff;
          position: relative;
          z-index: 5;
          box-shadow: 0 0 8px rgba(0,0,0,0.1);
        }
        .db-results-error {
          padding: 16px 24px;
          color: #dc2626;
          background: #fef2f2;
          font-family: monospace;
          font-size: 13px;
          border-left: 4px solid #dc2626;
          height: 100%;
          overflow: auto;
        }
        .db-results-success-msg {
          padding: 24px;
          color: #16a34a;
          background: #f0fdf4;
          font-size: 13px;
          font-weight: 500;
          text-align: center;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 8px;
        }

        /* Saved Queries Tab */
        .db-saved-wrap {
          padding: 24px;
          overflow-y: auto;
          flex: 1;
        }
        .db-saved-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }
        .db-saved-card {
          background: #ffffff;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          overflow: hidden;
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          transition: var(--transition);
        }
        .db-saved-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        .db-saved-card-header {
          padding: 16px;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #f8fafc;
        }
        .db-saved-card-title {
          font-weight: 700;
          color: var(--text-dark);
          font-size: 14px;
        }
        .db-saved-card-body {
          padding: 16px;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .db-saved-card-desc {
          font-size: 12px;
          color: var(--text-muted);
          line-height: 1.5;
        }
        .db-saved-card-sql {
          font-family: 'JetBrains Mono', monospace;
          background: #1e293b;
          color: #a7f3d0;
          padding: 10px;
          border-radius: var(--radius-sm);
          font-size: 11px;
          max-height: 80px;
          overflow: hidden;
          white-space: pre-wrap;
        }
        .db-saved-card-footer {
          padding: 12px 16px;
          border-top: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .db-saved-category-badge {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          padding: 2px 8px;
          border-radius: 10px;
        }
        .cat-finance { background: #fee2e2; color: #dc2626; }
        .cat-members { background: #e0f2fe; color: #0369a1; }
        .cat-trainers { background: #dcfce7; color: #15803d; }
        .cat-general { background: #f1f5f9; color: #475569; }

        /* Direct Table Browser Tab */
        .db-browse-wrap {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .db-browse-toolbar {
          padding: 12px 24px;
          border-bottom: 1px solid var(--border-color);
          background: #f8fafc;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .db-browse-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-dark);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .db-browse-search-wrap {
          flex: 1;
          max-width: 300px;
        }
        .db-browse-search-wrap input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          outline: none;
          font-size: 13px;
        }
        .db-browse-body {
          flex: 1;
          overflow: auto;
        }

        /* Modal Styles */
        .db-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .db-modal {
          background: #ffffff;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
          width: 90%;
          max-width: 550px;
          max-height: 85vh;
          overflow: hidden;
          box-shadow: var(--shadow-lg);
          display: flex;
          flex-direction: column;
          animation: slideDown 0.3s ease;
        }
        .db-modal-header {
          padding: 18px 24px;
          border-bottom: 1px solid var(--border-color);
          font-weight: 700;
          font-size: 16px;
          color: var(--text-dark);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .db-modal-close-btn {
          border: none;
          background: transparent;
          font-size: 18px;
          cursor: pointer;
          color: var(--text-muted);
        }
        .db-modal-body {
          padding: 24px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .db-modal-footer {
          padding: 16px 24px;
          border-top: 1px solid var(--border-color);
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          background: #f8fafc;
        }

        /* Toast notifications */
        .db-toast-container {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 2000;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .db-toast {
          padding: 12px 20px;
          border-radius: var(--radius-md);
          color: #ffffff;
          font-size: 13px;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          animation: slideDown 0.2s ease;
          max-width: 320px;
        }
        .toast-success {
          background: #10b981;
        }
        .toast-error {
          background: #ef4444;
        }
        .toast-info {
          background: #3b82f6;
        }

        kbd {
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          border-radius: 4px;
          padding: 1px 4px;
          font-size: 10px;
          color: #475569;
          font-family: inherit;
        }
      `}</style>

      <div className="page-header">
        <div>
          <h1>Veritabanı Yönetim Paneli</h1>
          <p className="subtitle">FitERP veri tabanı şemasını inceleyin, özel SQL sorguları çalıştırın ve raporlar oluşturun</p>
        </div>
        <div>
          <button className="btn btn-secondary" onClick={fetchData} style={{ marginRight: "8px" }}>
            🔄 Bağlantıyı Yenile
          </button>
          <button className="btn btn-primary" onClick={openAddModal}>
            💾 SQL Sorgusu Kaydet
          </button>
        </div>
      </div>

      <div className="db-layout">
        {/* DB Sidebar: Table Browser & Summary */}
        <div className="db-sidebar">
          <div className="db-sidebar-header">
            <span>🗄️</span>
            <span className="db-sidebar-title">Tablolar ({Object.keys(schema).length})</span>
          </div>

          <div className="db-sidebar-list">
            {Object.keys(schema).length > 0 ? (
              Object.keys(schema).map(tName => (
                <div 
                  key={tName} 
                  className={`db-sidebar-item ${selectedTable === tName && activeTab === "browse" ? "active" : ""}`}
                  onClick={() => handleTableBrowse(tName)}
                >
                  <span className="db-sidebar-item-icon">{getTableIcon(tName)}</span>
                  <span>{tName}</span>
                  <span className="db-sidebar-badge">
                    {stats.find(s => s.name === tName)?.rows ?? 0}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ padding: "16px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
                Tablo bulunamadı
              </div>
            )}
          </div>

          {/* Database Info Statistics */}
          <div className="db-stats-panel">
            <div className="db-stats-title">Veritabanı İstatistikleri</div>
            <div className="db-stats-row">
              <strong>Sistem:</strong> MySQL / MariaDB<br />
              <strong>Veritabanı:</strong> fiterp_db<br />
              <strong>Bağlantı:</strong> Aktif (Localhost)<br />
              <strong>Toplam Tablo:</strong> {Object.keys(schema).length}
            </div>
          </div>
        </div>

        {/* DB Main Area */}
        <div className="db-main">
          {/* Main Top tabs */}
          <div className="db-topbar">
            <button 
              className={`db-tab-btn ${activeTab === "schema" ? "active" : ""}`}
              onClick={() => setActiveTab("schema")}
            >
              🏗️ Şema Görünümü
            </button>
            <button 
              className={`db-tab-btn ${activeTab === "editor" ? "active" : ""}`}
              onClick={() => setActiveTab("editor")}
            >
              ⌨️ SQL Editörü <kbd>F5</kbd>
            </button>
            <button 
              className={`db-tab-btn ${activeTab === "saved" ? "active" : ""}`}
              onClick={() => setActiveTab("saved")}
            >
              💾 Kayıtlı Sorgular & Raporlar
            </button>
            {selectedTable && (
              <button 
                className={`db-tab-btn ${activeTab === "browse" ? "active" : ""}`}
                onClick={() => handleTableBrowse(selectedTable)}
              >
                📊 Tablo Tarayıcı: {selectedTable}
              </button>
            )}
          </div>

          <div className="db-content">
            {/* 1. SCHEMA VIEW */}
            {activeTab === "schema" && (
              <div className="db-schema-wrap">
                <div className="db-schema-grid">
                  {Object.keys(schema).map(tName => (
                    <div key={tName} className="db-schema-card">
                      <div className="db-schema-head">
                        <span className="db-schema-title-text">{getTableIcon(tName)} {tName}</span>
                        <span className="db-schema-badge">{getTableStats(tName)}</span>
                      </div>
                      <div className="db-schema-cols">
                        {schema[tName].cols.map(col => (
                          <div key={col.name} className="db-schema-col">
                            <span className="db-schema-col-name">
                              {col.pk && <span className="badge-pk" title="Primary Key (Birincil Anahtar)">PK</span>}
                              {col.fk && (
                                <span 
                                  className="badge-fk" 
                                  title={`Foreign Key -> ${col.fk}`}
                                >
                                  FK
                                </span>
                              )}
                              {col.nn && !col.pk && <span className="badge-nn" title="Not Null (Boş Bırakılamaz)">NN</span>}
                              {col.name}
                            </span>
                            <span className="db-schema-col-type">{col.type}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. SQL EDITOR VIEW */}
            {activeTab === "editor" && (
              <div className="db-editor-wrap">
                <div className="db-editor-toolbar">
                  <button className="btn btn-primary" onClick={() => runQuery()} disabled={executing}>
                    {executing ? "🔄 Çalıştırılıyor..." : "▶ Çalıştır"}
                  </button>
                  <button className="btn btn-secondary" onClick={clearEditor}>
                    🗑️ Temizle
                  </button>
                  <button className="btn btn-secondary" onClick={formatSQL}>
                    ✨ Formatla
                  </button>
                  <button className="btn btn-secondary" onClick={openAddModal}>
                    💾 Sorguyu Kaydet
                  </button>
                  {queryResult && queryResult.results && queryResult.results.length > 0 && (
                    <>
                      <button 
                        className="btn btn-secondary btn-icon" 
                        onClick={() => exportCSV(queryResult.results, queryResult.fields, "query_export")}
                        style={{ marginLeft: "auto" }}
                      >
                        ⬇️ CSV İndir
                      </button>
                      <button 
                        className="btn btn-secondary btn-icon" 
                        onClick={() => exportJSON(queryResult.results, "query_export")}
                      >
                        ⬇️ JSON İndir
                      </button>
                    </>
                  )}
                </div>

                <div className="db-editor-main">
                  <div className="db-editor-left">
                    <div className="db-textarea-container">
                      <div className="db-line-nums" ref={lineNumsRef}>1</div>
                      <textarea
                        ref={sqlEditorRef}
                        className="db-textarea"
                        value={sqlQuery}
                        onChange={(e) => { setSqlQuery(e.target.value); updateLineNums(); }}
                        onKeyDown={handleKey}
                        placeholder="-- SQL sorgunuzu buraya yazıp Çalıştır'a tıklayın veya F5'e basın&#10;-- Örnek: SELECT * FROM members LIMIT 5;"
                        spellCheck="false"
                      />
                    </div>
                  </div>

                  <div className="db-editor-right">
                    <div className="db-editor-right-title">Hızlı SQL Şablonları</div>
                    {savedQueries.map(q => (
                      <div 
                        key={q.id} 
                        className="db-snippet-card"
                        onClick={() => loadSnippet(q.sql)}
                        title="Editöre yükle"
                      >
                        <div className="db-snippet-card-title">{q.name}</div>
                        <div className="db-snippet-card-desc">{q.description}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Results Panel */}
                <div className="db-results-panel">
                  <div className="db-results-header">
                    <span>📋 Sorgu Sonuçları</span>
                    {queryResult && !queryResult.error && (
                      <span className="db-results-info">
                        ({queryResult.isMutation 
                          ? `Etkilenen satır sayısı: ${queryResult.results.affectedRows || 0}` 
                          : `${queryResult.results.length} satır listelendi`} - {queryResult.timeMs} ms)
                      </span>
                    )}
                  </div>
                  <div className="db-results-body">
                    {!queryResult && (
                      <div className="db-results-empty">
                        Sorgu henüz çalıştırılmadı. Sonuçlar burada görüntülenecektir.
                      </div>
                    )}

                    {queryResult && queryResult.error && (
                      <div className="db-results-error">
                        <strong>SQL Hata Mesajı:</strong><br />
                        {queryResult.error}
                      </div>
                    )}

                    {queryResult && !queryResult.error && queryResult.isMutation && (
                      <div className="db-results-success-msg">
                        <span style={{ fontSize: "20px" }}>✅</span>
                        <div>Sorgu başarıyla çalıştırıldı!</div>
                        <div style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                          Etkilenen Satır Sayısı: {queryResult.results.affectedRows || 0} | 
                          Kayıt ID: {queryResult.results.insertId || "-"} |
                          Mesaj: {queryResult.results.message || "-"}
                        </div>
                      </div>
                    )}

                    {queryResult && !queryResult.error && !queryResult.isMutation && (
                      queryResult.results.length > 0 ? (
                        <table className="db-results-table">
                          <thead>
                            <tr>
                              {queryResult.fields.map(f => <th key={f}>{f}</th>)}
                            </tr>
                          </thead>
                          <tbody>
                            {queryResult.results.map((row, idx) => (
                              <tr key={idx}>
                                {queryResult.fields.map(f => {
                                  const val = row[f];
                                  return (
                                    <td key={f}>
                                      {val === null || val === undefined ? (
                                        <em style={{ color: "#94a3b8" }}>null</em>
                                      ) : (
                                        String(val)
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="db-results-empty">
                          Sorgu başarıyla tamamlandı fakat veri döndürmedi.
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 3. SAVED QUERIES VIEW */}
            {activeTab === "saved" && (
              <div className="db-saved-wrap">
                <div className="db-saved-grid">
                  {savedQueries.map(q => (
                    <div key={q.id} className="db-saved-card">
                      <div className="db-saved-card-header">
                        <span className="db-saved-card-title">{q.name}</span>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button 
                            className="btn btn-icon btn-edit" 
                            style={{ padding: "4px 8px" }}
                            onClick={() => openEditModal(q)}
                          >
                            Düzenle
                          </button>
                          <button 
                            className="btn btn-icon btn-delete"
                            style={{ padding: "4px 8px" }}
                            onClick={(e) => deleteSavedQuery(q.id, e)}
                          >
                            Sil
                          </button>
                        </div>
                      </div>
                      <div className="db-saved-card-body">
                        <p className="db-saved-card-desc">{q.description}</p>
                        <div className="db-saved-card-sql">{q.sql}</div>
                      </div>
                      <div className="db-saved-card-footer">
                        <span className={`db-saved-category-badge cat-${q.category || "general"}`}>
                          {q.category}
                        </span>
                        <button 
                          className="btn btn-primary btn-icon" 
                          onClick={() => { setSqlQuery(q.sql); setActiveTab("editor"); }}
                        >
                          ⚡ Editörde Aç
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. DIRECT TABLE DATA BROWSER */}
            {activeTab === "browse" && selectedTable && (
              <div className="db-browse-wrap">
                <div className="db-browse-toolbar">
                  <div className="db-browse-title">
                    <span>{getTableIcon(selectedTable)}</span>
                    <span>{selectedTable} Tablosu</span>
                  </div>

                  <div className="db-browse-search-wrap">
                    <input 
                      type="text" 
                      placeholder="Tablo içinde ara..." 
                      value={browseSearch}
                      onChange={(e) => setSearchQuery(e.target.value) || setBrowseSearch(e.target.value)}
                    />
                  </div>

                  <button 
                    className="btn btn-secondary btn-icon" 
                    onClick={() => exportCSV(browseData.rows, browseData.fields, selectedTable)}
                    style={{ marginLeft: "auto" }}
                  >
                    ⬇️ CSV Dışa Aktar
                  </button>
                </div>

                <div className="db-browse-body">
                  {filteredBrowseRows.length > 0 ? (
                    <table className="db-results-table">
                      <thead>
                        <tr>
                          {browseData.fields.map(f => <th key={f}>{f}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBrowseRows.map((row, idx) => (
                          <tr key={idx}>
                            {browseData.fields.map(f => {
                              const val = row[f];
                              return (
                                <td key={f}>
                                  {val === null || val === undefined ? (
                                    <em style={{ color: "#94a3b8" }}>null</em>
                                  ) : (
                                    String(val)
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="db-results-empty">
                      Tabloda listelenecek satır bulunamadı.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Query Save/Edit Modal */}
      {modalOpen && (
        <div className="db-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="db-modal" onClick={(e) => e.stopPropagation()}>
            <div className="db-modal-header">
              <span>{modalMode === "add" ? "💾 Yeni Rapor/Sorgu Kaydet" : "✏️ Sorguyu Düzenle"}</span>
              <button className="db-modal-close-btn" onClick={() => setModalOpen(false)}>✕</button>
            </div>
            <div className="db-modal-body">
              <div className="form-group">
                <label>Sorgu/Rapor Adı *</label>
                <input 
                  type="text" 
                  value={modalData.name} 
                  onChange={(e) => setModalData({ ...modalData, name: e.target.value })}
                  placeholder="Örn: Aktif Üye Ödeme Ortalaması"
                />
              </div>

              <div className="form-group">
                <label>Açıklama</label>
                <input 
                  type="text" 
                  value={modalData.description} 
                  onChange={(e) => setModalData({ ...modalData, description: e.target.value })}
                  placeholder="Raporun ne işe yaradığını kısaca açıklayın"
                />
              </div>

              <div className="form-group">
                <label>Kategori</label>
                <select 
                  value={modalData.category} 
                  onChange={(e) => setModalData({ ...modalData, category: e.target.value })}
                >
                  <option value="general">Genel Rapor</option>
                  <option value="finance">Finans & Ödemeler</option>
                  <option value="members">Üyeler & Kayıtlar</option>
                  <option value="trainers">Eğitmenler</option>
                </select>
              </div>

              <div className="form-group">
                <label>SQL Sorgusu *</label>
                <textarea 
                  value={modalData.sql} 
                  onChange={(e) => setModalData({ ...modalData, sql: e.target.value })}
                  rows="6"
                  placeholder="SELECT * FROM ..."
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "12px",
                    background: "#1e293b",
                    color: "#a7f3d0",
                    border: "none",
                    borderRadius: "var(--radius-sm)",
                    padding: "10px",
                    resize: "vertical"
                  }}
                />
              </div>
            </div>
            <div className="db-modal-footer">
              <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>İptal</button>
              <button className="btn btn-primary" onClick={saveQueryModal}>Kaydet</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="db-toast-container">
          <div className={`db-toast toast-${toast.type}`}>
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}

export default DatabaseManager;
