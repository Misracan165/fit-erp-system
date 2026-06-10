import { useEffect, useState } from "react";

function ProjectManagement() {
  const [activeTab, setActiveTab] = useState("overview"); // overview, team, tasks, cpm, budget
  const [team, setTeam] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [budget, setBudget] = useState([]);

  // Form states
  const [teamForm, setTeamForm] = useState({ id: null, full_name: "", role: "", email: "" });
  const [taskForm, setTaskForm] = useState({ id: null, name: "", description: "", start_date: "", duration_days: 1, progress: 0, assignee_id: "", dependencies: [] });
  const [budgetForm, setBudgetForm] = useState({ id: null, type: "expense", category: "", amount: "", date: "", description: "" });

  const [showTeamForm, setShowTeamForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showBudgetForm, setShowBudgetForm] = useState(false);

  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch all PM data
  const fetchTeam = () => {
    fetch("http://localhost:5000/pm/team")
      .then(res => res.json())
      .then(data => setTeam(data))
      .catch(() => showToast("Ekip verileri yüklenemedi.", "error"));
  };

  const fetchTasks = () => {
    fetch("http://localhost:5000/pm/tasks")
      .then(res => res.json())
      .then(data => setTasks(data))
      .catch(() => showToast("Görev verileri yüklenemedi.", "error"));
  };

  const fetchBudget = () => {
    fetch("http://localhost:5000/pm/budget")
      .then(res => res.json())
      .then(data => setBudget(data))
      .catch(() => showToast("Bütçe verileri yüklenemedi.", "error"));
  };

  useEffect(() => {
    fetchTeam();
    fetchTasks();
    fetchBudget();
  }, []);

  // Team CRUD handlers
  const handleTeamSubmit = async (e) => {
    e.preventDefault();
    if (!teamForm.full_name.trim()) return alert("Ad soyad zorunludur.");
    const isEdit = !!teamForm.id;
    const url = isEdit ? `http://localhost:5000/pm/team/${teamForm.id}` : "http://localhost:5000/pm/team";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(teamForm)
      });
      if (!res.ok) throw new Error();
      showToast(isEdit ? "Ekip üyesi güncellendi." : "Ekip üyesi eklendi.");
      setTeamForm({ id: null, full_name: "", role: "", email: "" });
      setShowTeamForm(false);
      fetchTeam();
    } catch {
      showToast("Ekip üyesi kaydedilemedi.", "error");
    }
  };

  const deleteTeam = async (id) => {
    if (!window.confirm("Bu ekip üyesini silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`http://localhost:5000/pm/team/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      showToast("Ekip üyesi silindi.");
      fetchTeam();
      fetchTasks(); // Refresh tasks as assignee might have been set to NULL
    } catch {
      showToast("Ekip üyesi silinemedi.", "error");
    }
  };

  // Task CRUD handlers
  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    if (!taskForm.name.trim()) return alert("Görev adı zorunludur.");
    
    // Convert dependencies array to string
    const payload = {
      ...taskForm,
      assignee_id: taskForm.assignee_id || null,
      dependencies: taskForm.dependencies.join(",")
    };

    const isEdit = !!taskForm.id;
    const url = isEdit ? `http://localhost:5000/pm/tasks/${taskForm.id}` : "http://localhost:5000/pm/tasks";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error();
      showToast(isEdit ? "Görev güncellendi." : "Görev eklendi.");
      setTaskForm({ id: null, name: "", description: "", start_date: "", duration_days: 1, progress: 0, assignee_id: "", dependencies: [] });
      setShowTaskForm(false);
      fetchTasks();
    } catch {
      showToast("Görev kaydedilemedi.", "error");
    }
  };

  const deleteTask = async (id) => {
    if (!window.confirm("Bu görevi silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`http://localhost:5000/pm/tasks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      showToast("Görev silindi.");
      fetchTasks();
    } catch {
      showToast("Görev silinemedi.", "error");
    }
  };

  // Budget CRUD handlers
  const handleBudgetSubmit = async (e) => {
    e.preventDefault();
    if (!budgetForm.category.trim() || !budgetForm.amount) return alert("Kategori ve Tutar zorunludur.");
    const isEdit = !!budgetForm.id;
    const url = isEdit ? `http://localhost:5000/pm/budget/${budgetForm.id}` : "http://localhost:5000/pm/budget";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(budgetForm)
      });
      if (!res.ok) throw new Error();
      showToast(isEdit ? "Bütçe hareketi güncellendi." : "Bütçe hareketi eklendi.");
      setBudgetForm({ id: null, type: "expense", category: "", amount: "", date: "", description: "" });
      setShowBudgetForm(false);
      fetchBudget();
    } catch {
      showToast("Bütçe hareketi kaydedilemedi.", "error");
    }
  };

  const deleteBudget = async (id) => {
    if (!window.confirm("Bu bütçe hareketini silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`http://localhost:5000/pm/budget/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      showToast("Bütçe hareketi silindi.");
      fetchBudget();
    } catch {
      showToast("Bütçe hareketi silinemedi.", "error");
    }
  };

  // ────────────────────────────────────────────────────────────────
  // CPM (Critical Path Method) CALCULATOR
  // ────────────────────────────────────────────────────────────────
  const calculateCPM = () => {
    if (tasks.length === 0) return { schedule: [], criticalPath: [], error: null };

    // Map tasks by ID
    const taskMap = {};
    tasks.forEach(t => {
      taskMap[t.id] = {
        ...t,
        duration: Number(t.duration_days) || 1,
        predecessors: t.dependencies ? t.dependencies.split(",").map(Number).filter(Boolean) : [],
        successors: [],
        es: 0, ef: 0, ls: 0, lf: 0, slack: 0, isCritical: false
      };
    });

    // Populate successors
    Object.keys(taskMap).forEach(id => {
      taskMap[id].predecessors.forEach(predId => {
        if (taskMap[predId]) {
          taskMap[predId].successors.push(Number(id));
        }
      });
    });

    // Topological Sort to check cycle and get order
    const visited = {};
    const tempVisited = {};
    const order = [];
    let hasCycle = false;

    const visit = (id) => {
      if (tempVisited[id]) {
        hasCycle = true;
        return;
      }
      if (!visited[id]) {
        tempVisited[id] = true;
        taskMap[id].successors.forEach(visit);
        visited[id] = true;
        delete tempVisited[id];
        order.push(Number(id));
      }
    };

    Object.keys(taskMap).forEach(id => {
      if (!visited[id]) visit(Number(id));
    });

    if (hasCycle) {
      return { schedule: [], criticalPath: [], error: "Döngüsel Bağımlılık Tespit Edildi! Görevlerin öncülleri birbirini kısır döngüye sokuyor." };
    }

    // Topological order is reversed (descending successors), so reverse it to run forward pass
    const forwardOrder = [...order].reverse();

    // 1. Forward Pass
    forwardOrder.forEach(id => {
      const t = taskMap[id];
      if (t.predecessors.length === 0) {
        t.es = 0;
      } else {
        t.es = Math.max(...t.predecessors.map(pId => taskMap[pId] ? taskMap[pId].ef : 0));
      }
      t.ef = t.es + t.duration;
    });

    // Project completion time
    const projectDuration = Math.max(...Object.values(taskMap).map(t => t.ef), 0);

    // 2. Backward Pass
    // Order is already topologically sorted, so just iterate backward
    const backwardOrder = [...order];
    backwardOrder.forEach(id => {
      const t = taskMap[id];
      if (t.successors.length === 0) {
        t.lf = projectDuration;
      } else {
        t.lf = Math.min(...t.successors.map(sId => taskMap[sId] ? taskMap[sId].ls : projectDuration));
      }
      t.ls = t.lf - t.duration;
      t.slack = t.lf - t.ef;
      t.isCritical = t.slack === 0;
    });

    const schedule = Object.values(taskMap).sort((a, b) => a.es - b.es || a.id - b.id);
    const criticalPath = schedule.filter(t => t.isCritical);

    return { schedule, criticalPath, error: null };
  };

  const cpmData = calculateCPM();

  // Financial statistics
  const totalIncome = budget.filter(b => b.type === "income").reduce((s, b) => s + Number(b.amount), 0);
  const totalExpense = budget.filter(b => b.type === "expense").reduce((s, b) => s + Number(b.amount), 0);
  const netCapital = totalIncome - totalExpense;

  const getAssigneeName = (id) => {
    const found = team.find(m => m.id === id);
    return found ? found.full_name : "Atanmamış";
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("tr-TR");
  };

  return (
    <div className="project-management-page animate-fade-in">
      <style>{`
        .pm-tabs {
          display: flex;
          gap: 12px;
          margin-bottom: 30px;
          border-bottom: 2px solid var(--border-color);
          padding-bottom: 12px;
        }
        .pm-tab-btn {
          padding: 10px 20px;
          border-radius: var(--radius-md);
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          border: none;
          background: #f1f5f9;
          color: #475569;
          transition: var(--transition);
        }
        .pm-tab-btn:hover {
          background: #e2e8f0;
          color: var(--text-dark);
        }
        .pm-tab-btn.active {
          background: var(--primary-color);
          color: white;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        /* Gantt Chart Rendering */
        .gantt-container {
          background: white;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 24px;
          margin-bottom: 30px;
          overflow-x: auto;
        }
        .gantt-header-row {
          display: flex;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 10px;
          margin-bottom: 10px;
          font-weight: bold;
          font-size: 13px;
          color: #475569;
        }
        .gantt-row {
          display: flex;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #f1f5f9;
          font-size: 13px;
        }
        .gantt-row:last-child {
          border-bottom: none;
        }
        .gantt-task-name {
          width: 200px;
          font-weight: 600;
          color: var(--text-dark);
          flex-shrink: 0;
        }
        .gantt-assignee {
          width: 120px;
          color: var(--text-muted);
          font-size: 12px;
          flex-shrink: 0;
        }
        .gantt-timeline-container {
          flex: 1;
          position: relative;
          height: 28px;
          background: #f8fafc;
          border-radius: 4px;
          overflow: hidden;
        }
        .gantt-bar {
          position: absolute;
          height: 100%;
          border-radius: 4px;
          background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 10px;
          font-weight: bold;
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
          transition: var(--transition);
        }
        .gantt-bar.critical {
          background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
          box-shadow: 0 2px 6px rgba(239, 68, 68, 0.4), 0 0 8px rgba(239, 68, 68, 0.3);
          animation: pulseRed 2s infinite alternate;
        }
        @keyframes pulseRed {
          from { box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3); }
          to { box-shadow: 0 2px 10px rgba(239, 68, 68, 0.6), 0 0 12px rgba(239, 68, 68, 0.4); }
        }

        .pm-toast-container {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 2000;
        }
        .pm-toast {
          padding: 12px 20px;
          border-radius: var(--radius-md);
          color: white;
          font-size: 13px;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .toast-success { background: #10b981; }
        .toast-error { background: #ef4444; }

        .cpm-error-box {
          background: #fef2f2;
          color: #dc2626;
          padding: 16px;
          border-radius: var(--radius-md);
          border-left: 4px solid #dc2626;
          margin-bottom: 24px;
          font-size: 14px;
          font-weight: 600;
        }

        .dependency-tag {
          display: inline-block;
          background: #e2e8f0;
          color: #475569;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
          margin-right: 4px;
        }
      `}</style>

      <div className="page-header">
        <div>
          <h1>Proje Yönetimi & Planlama</h1>
          <p className="subtitle">Ekibinizi yönetin, görev atamalarını yapın, bütçeyi takip edin ve CPM/Gantt ile kritik yolları analiz edin</p>
        </div>
        <div>
          {activeTab === "team" && (
            <button className="btn btn-primary" onClick={() => { setShowTeamForm(!showTeamForm); setTeamForm({ id: null, full_name: "", role: "", email: "" }); }}>
              {showTeamForm ? "Kapat" : "Yeni Üye Ekle"}
            </button>
          )}
          {activeTab === "tasks" && (
            <button className="btn btn-primary" onClick={() => { setShowTaskForm(!showTaskForm); setTaskForm({ id: null, name: "", description: "", start_date: "", duration_days: 1, progress: 0, assignee_id: "", dependencies: [] }); }}>
              {showTaskForm ? "Kapat" : "Yeni Görev Ekle"}
            </button>
          )}
          {activeTab === "budget" && (
            <button className="btn btn-primary" onClick={() => { setShowBudgetForm(!showBudgetForm); setBudgetForm({ id: null, type: "expense", category: "", amount: "", date: "", description: "" }); }}>
              {showBudgetForm ? "Kapat" : "Bütçe Hareketi Ekle"}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="pm-tabs">
        <button className={`pm-tab-btn ${activeTab === "overview" ? "active" : ""}`} onClick={() => setActiveTab("overview")}>📊 Genel Özet & Gantt</button>
        <button className={`pm-tab-btn ${activeTab === "tasks" ? "active" : ""}`} onClick={() => setActiveTab("tasks")}>📋 Görev Yönetimi</button>
        <button className={`pm-tab-btn ${activeTab === "cpm" ? "active" : ""}`} onClick={() => setActiveTab("cpm")}>⚡ Kritik Yol (CPM)</button>
        <button className={`pm-tab-btn ${activeTab === "team" ? "active" : ""}`} onClick={() => setActiveTab("team")}>👥 Ekip Yönetimi</button>
        <button className={`pm-tab-btn ${activeTab === "budget" ? "active" : ""}`} onClick={() => setActiveTab("budget")}>💰 Sermaye & Bütçe</button>
      </div>

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB 1: OVERVIEW & GANTT */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="overview-tab-content">
          <div className="card-container">
            <div className="stat-card">
              <div>
                <h3>Proje Sermayesi</h3>
                <div className="stat-value">₺{netCapital.toLocaleString("tr-TR")}</div>
              </div>
              <div className="stat-icon icon-revenue">₺</div>
            </div>
            <div className="stat-card">
              <div>
                <h3>Toplam Görev</h3>
                <div className="stat-value">{tasks.length}</div>
              </div>
              <div className="stat-icon icon-users">📋</div>
            </div>
            <div className="stat-card">
              <div>
                <h3>Kritik Görevler</h3>
                <div className="stat-value">{cpmData.criticalPath.length}</div>
              </div>
              <div className="stat-icon icon-payments" style={{ color: "#dc2626", background: "#fef2f2" }}>⚠️</div>
            </div>
            <div className="stat-card">
              <div>
                <h3>Ekip Büyüklüğü</h3>
                <div className="stat-value">{team.length} Kişi</div>
              </div>
              <div className="stat-icon icon-trainers">👥</div>
            </div>
          </div>

          <h2>Göreve Göre Gantt Şeması</h2>
          <p className="subtitle" style={{ marginBottom: "15px" }}>Kritik yoldaki görevler kırmızı renkle yanıp söner. ES (Early Start) ve Duration değerlerine göre çizilmiştir.</p>
          
          {cpmData.error && <div className="cpm-error-box">{cpmData.error}</div>}

          <div className="gantt-container">
            {cpmData.schedule.length > 0 ? (
              <>
                <div className="gantt-header-row">
                  <div className="gantt-task-name">Görev Adı</div>
                  <div className="gantt-assignee">Atanan</div>
                  <div style={{ flex: 1, textAlign: "left", paddingLeft: "10px" }}>
                    Zaman Cetveli (Günler / ES - EF Aralığı)
                  </div>
                </div>
                {cpmData.schedule.map(t => {
                  const maxDay = Math.max(...cpmData.schedule.map(x => x.ef), 10);
                  const leftPct = (t.es / maxDay) * 100;
                  const widthPct = (t.duration / maxDay) * 100;

                  return (
                    <div className="gantt-row" key={t.id}>
                      <div className="gantt-task-name">
                        {t.isCritical && <span style={{ color: "#ef4444", marginRight: "6px" }}>🔥</span>}
                        {t.name}
                      </div>
                      <div className="gantt-assignee">{getAssigneeName(t.assignee_id)}</div>
                      <div className="gantt-timeline-container">
                        <div 
                          className={`gantt-bar ${t.isCritical ? "critical" : ""}`}
                          style={{
                            left: `${leftPct}%`,
                            width: `${widthPct}%`
                          }}
                        >
                          {t.es + 1}. - {t.ef}. Gün
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <div style={{ textAlign: "center", color: "#64748b", padding: "30px 0" }}>
                Gantt şemasını çizmek için lütfen görevleri tanımlayın.
              </div>
            )}
          </div>

          <h2>Kişiye Göre Gantt Şeması (İş Yükü Dağılımı)</h2>
          <p className="subtitle" style={{ marginBottom: "15px" }}>Ekip üyelerinin zaman içindeki görev yoğunlukları.</p>
          <div className="gantt-container">
            {team.length > 0 && tasks.length > 0 ? (
              <>
                <div className="gantt-header-row">
                  <div className="gantt-task-name">Çalışan</div>
                  <div style={{ flex: 1, textAlign: "left", paddingLeft: "10px" }}>Görev Dağılımı</div>
                </div>
                {team.map(member => {
                  const memberTasks = cpmData.schedule.filter(t => t.assignee_id === member.id);
                  return (
                    <div className="gantt-row" key={member.id}>
                      <div className="gantt-task-name">
                        👤 {member.full_name}
                        <div style={{ fontSize: "10px", color: "#64748b", fontWeight: "normal" }}>{member.role}</div>
                      </div>
                      <div className="gantt-timeline-container" style={{ height: "40px", background: "#f8fafc" }}>
                        {memberTasks.map(t => {
                          const maxDay = Math.max(...cpmData.schedule.map(x => x.ef), 10);
                          const leftPct = (t.es / maxDay) * 100;
                          const widthPct = (t.duration / maxDay) * 100;
                          return (
                            <div 
                              key={t.id}
                              className={`gantt-bar ${t.isCritical ? "critical" : ""}`}
                              style={{
                                left: `${leftPct}%`,
                                width: `${widthPct}%`,
                                height: "24px",
                                top: "8px",
                                fontSize: "9px"
                              }}
                              title={t.name}
                            >
                              {t.name.slice(0, 15)}
                            </div>
                          );
                        })}
                        {memberTasks.length === 0 && (
                          <div style={{ fontSize: "11px", color: "#94a3b8", display: "flex", alignItems: "center", height: "100%", paddingLeft: "12px" }}>
                            Aktif görev ataması yok
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <div style={{ textAlign: "center", color: "#64748b", padding: "30px 0" }}>
                Görünüm için ekip üyeleri ve atanmış görevlerin olması gerekmektedir.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB 2: TASKS CRUD */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeTab === "tasks" && (
        <div className="tasks-tab-content">
          {showTaskForm && (
            <div className="form-card animate-slide-down">
              <h2>{taskForm.id ? "Görevi Düzenle" : "Yeni Görev Ekle"}</h2>
              <form onSubmit={handleTaskSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Görev Adı *</label>
                    <input 
                      type="text" 
                      required
                      value={taskForm.name} 
                      onChange={e => setTaskForm({ ...taskForm, name: e.target.value })}
                      placeholder="Örn: Veritabanı Tasarımı"
                    />
                  </div>

                  <div className="form-group">
                    <label>Başlangıç Tarihi</label>
                    <input 
                      type="date" 
                      value={taskForm.start_date ? taskForm.start_date.slice(0, 10) : ""} 
                      onChange={e => setTaskForm({ ...taskForm, start_date: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Süre (Gün) *</label>
                    <input 
                      type="number" 
                      min="1"
                      required
                      value={taskForm.duration_days} 
                      onChange={e => setTaskForm({ ...taskForm, duration_days: Number(e.target.value) })}
                    />
                  </div>

                  <div className="form-group">
                    <label>İlerleme (%)</label>
                    <input 
                      type="number" 
                      min="0"
                      max="100"
                      value={taskForm.progress} 
                      onChange={e => setTaskForm({ ...taskForm, progress: Number(e.target.value) })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Atanan Ekip Üyesi</label>
                    <select 
                      value={taskForm.assignee_id || ""} 
                      onChange={e => setTaskForm({ ...taskForm, assignee_id: e.target.value })}
                    >
                      <option value="">Seçiniz...</option>
                      {team.map(member => (
                        <option key={member.id} value={member.id}>{member.full_name} ({member.role})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Öncül Görevler (Dependencies)</label>
                    <select 
                      multiple
                      value={taskForm.dependencies} 
                      onChange={e => {
                        const values = Array.from(e.target.selectedOptions, option => option.value);
                        setTaskForm({ ...taskForm, dependencies: values });
                      }}
                      style={{ height: "80px" }}
                    >
                      {tasks.filter(t => t.id !== taskForm.id).map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    <span style={{ fontSize: "10px", color: "#64748b" }}>Birden fazla seçmek için Ctrl tuşuna basılı tutun.</span>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: "20px" }}>
                  <label>Açıklama</label>
                  <input 
                    type="text" 
                    value={taskForm.description || ""} 
                    onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                    placeholder="Göreve ait açıklama notları..."
                  />
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowTaskForm(false)}>İptal</button>
                  <button type="submit" className="btn btn-primary">Kaydet</button>
                </div>
              </form>
            </div>
          )}

          <div className="table-container">
            {tasks.length > 0 ? (
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Görev</th>
                    <th>Açıklama</th>
                    <th>Başlangıç</th>
                    <th>Süre</th>
                    <th>İlerleme</th>
                    <th>Atanan</th>
                    <th>Öncüller</th>
                    <th className="actions-header">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map(t => {
                    const deps = t.dependencies ? t.dependencies.split(",").map(Number).filter(Boolean) : [];
                    return (
                      <tr key={t.id}>
                        <td><strong>{t.name}</strong></td>
                        <td>{t.description || "-"}</td>
                        <td>{formatDate(t.start_date)}</td>
                        <td>{t.duration_days} Gün</td>
                        <td>
                          <span className="badge badge-standart" style={{ background: "#eff6ff", color: "#1e40af" }}>
                            %{t.progress}
                          </span>
                        </td>
                        <td>👤 {getAssigneeName(t.assignee_id)}</td>
                        <td>
                          {deps.map(dId => {
                            const name = tasks.find(x => x.id === dId)?.name || `#${dId}`;
                            return <span key={dId} className="dependency-tag">{name}</span>;
                          })}
                          {deps.length === 0 && "-"}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button className="btn btn-icon btn-edit" onClick={() => {
                              setTaskForm({
                                id: t.id,
                                name: t.name,
                                description: t.description || "",
                                start_date: t.start_date || "",
                                duration_days: t.duration_days || 1,
                                progress: t.progress || 0,
                                assignee_id: t.assignee_id || "",
                                dependencies: t.dependencies ? t.dependencies.split(",") : []
                              });
                              setShowTaskForm(true);
                            }}>
                              Düzenle
                            </button>
                            <button className="btn btn-icon btn-delete" onClick={() => deleteTask(t.id)}>
                              Sil
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <p>Henüz tanımlanmış görev bulunmamaktadır.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB 3: CPM ANALYSIS */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeTab === "cpm" && (
        <div className="cpm-tab-content">
          <h2>Kritik Yol Yöntemi (CPM) Hesaplama Çizelgesi</h2>
          <p className="subtitle" style={{ marginBottom: "20px" }}>Projenin en erken ve en geç tamamlanma sürelerinin hesabı. Bolluk (Slack) değeri 0 olan işler projenin Kritik Yolu'ndadır ve gecikmeleri doğrudan proje teslim tarihini öteler.</p>
          
          {cpmData.error && <div className="cpm-error-box">{cpmData.error}</div>}

          <div className="table-container">
            {cpmData.schedule.length > 0 ? (
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Görev</th>
                    <th>Süre</th>
                    <th>En Erken Başlangıç (ES)</th>
                    <th>En Erken Bitiş (EF)</th>
                    <th>En Geç Başlangıç (LS)</th>
                    <th>En Geç Bitiş (LF)</th>
                    <th>Bolluk (Slack)</th>
                    <th>Kritik mi?</th>
                  </tr>
                </thead>
                <tbody>
                  {cpmData.schedule.map(t => (
                    <tr 
                      key={t.id}
                      style={{
                        background: t.isCritical ? "#fef2f2" : "transparent"
                      }}
                    >
                      <td>
                        <strong>{t.name}</strong>
                      </td>
                      <td>{t.duration} Gün</td>
                      <td>{t.es}. Gün</td>
                      <td>{t.ef}. Gün</td>
                      <td>{t.ls}. Gün</td>
                      <td>{t.lf}. Gün</td>
                      <td>
                        <span style={{ fontWeight: "bold", color: t.isCritical ? "#dc2626" : "#475569" }}>
                          {t.slack} Gün
                        </span>
                      </td>
                      <td>
                        {t.isCritical ? (
                          <span className="badge badge-premium" style={{ background: "#fee2e2", color: "#dc2626" }}>
                            🔴 KRİTİK GÖREV
                          </span>
                        ) : (
                          <span className="badge badge-standart">Normal</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <p>Analiz çizelgesini görüntülemek için görev tanımlamanız gerekmektedir.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB 4: TEAM CRUD */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeTab === "team" && (
        <div className="team-tab-content">
          {showTeamForm && (
            <div className="form-card animate-slide-down">
              <h2>{teamForm.id ? "Üye Düzenle" : "Yeni Ekip Üyesi Ekle"}</h2>
              <form onSubmit={handleTeamSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Ad Soyad *</label>
                    <input 
                      type="text" 
                      required
                      value={teamForm.full_name} 
                      onChange={e => setTeamForm({ ...teamForm, full_name: e.target.value })}
                      placeholder="Örn: Can Yılmaz"
                    />
                  </div>

                  <div className="form-group">
                    <label>Rol / Pozisyon</label>
                    <input 
                      type="text" 
                      value={teamForm.role} 
                      onChange={e => setTeamForm({ ...teamForm, role: e.target.value })}
                      placeholder="Örn: Proje Yöneticisi"
                    />
                  </div>

                  <div className="form-group">
                    <label>E-posta Adresi</label>
                    <input 
                      type="email" 
                      value={teamForm.email} 
                      onChange={e => setTeamForm({ ...teamForm, email: e.target.value })}
                      placeholder="can@example.com"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowTeamForm(false)}>İptal</button>
                  <button type="submit" className="btn btn-primary">Kaydet</button>
                </div>
              </form>
            </div>
          )}

          <div className="table-container">
            {team.length > 0 ? (
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Ad Soyad</th>
                    <th>Rol / Pozisyon</th>
                    <th>E-posta</th>
                    <th className="actions-header">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {team.map(member => (
                    <tr key={member.id}>
                      <td>
                        <div className="member-name-cell">
                          <div className="avatar">{member.full_name.charAt(0).toUpperCase()}</div>
                          <strong>{member.full_name}</strong>
                        </div>
                      </td>
                      <td>{member.role || "-"}</td>
                      <td>{member.email || "-"}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn btn-icon btn-edit" onClick={() => {
                            setTeamForm({
                              id: member.id,
                              full_name: member.full_name,
                              role: member.role || "",
                              email: member.email || ""
                            });
                            setShowTeamForm(true);
                          }}>
                            Düzenle
                          </button>
                          <button className="btn btn-icon btn-delete" onClick={() => deleteTeam(member.id)}>
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
                <p>Henüz tanımlanmış ekip üyesi bulunmamaktadır.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB 5: CAPITAL & BUDGET */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeTab === "budget" && (
        <div className="budget-tab-content">
          {showBudgetForm && (
            <div className="form-card animate-slide-down">
              <h2>{budgetForm.id ? "Bütçe Hareketini Düzenle" : "Bütçe Hareketi Kaydet"}</h2>
              <form onSubmit={handleBudgetSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Tür *</label>
                    <select 
                      value={budgetForm.type} 
                      onChange={e => setBudgetForm({ ...budgetForm, type: e.target.value })}
                    >
                      <option value="expense">Gider (Expense)</option>
                      <option value="income">Gelir / Sermaye (Income)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Kategori *</label>
                    <input 
                      type="text" 
                      required
                      value={budgetForm.category} 
                      onChange={e => setBudgetForm({ ...budgetForm, category: e.target.value })}
                      placeholder="Örn: Donanım Alımı, Devlet Desteği"
                    />
                  </div>

                  <div className="form-group">
                    <label>Tutar (₺) *</label>
                    <input 
                      type="number" 
                      step="0.01"
                      required
                      value={budgetForm.amount} 
                      onChange={e => setBudgetForm({ ...budgetForm, amount: Number(e.target.value) })}
                    />
                  </div>

                  <div className="form-group">
                    <label>İşlem Tarihi</label>
                    <input 
                      type="date" 
                      value={budgetForm.date ? budgetForm.date.slice(0, 10) : ""} 
                      onChange={e => setBudgetForm({ ...budgetForm, date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: "20px" }}>
                  <label>Açıklama</label>
                  <input 
                    type="text" 
                    value={budgetForm.description || ""} 
                    onChange={e => setBudgetForm({ ...budgetForm, description: e.target.value })}
                    placeholder="Ek açıklamalar..."
                  />
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowBudgetForm(false)}>İptal</button>
                  <button type="submit" className="btn btn-primary">Kaydet</button>
                </div>
              </form>
            </div>
          )}

          <div className="table-container">
            {budget.length > 0 ? (
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Tarih</th>
                    <th>Tür</th>
                    <th>Kategori</th>
                    <th>Tutar</th>
                    <th>Açıklama</th>
                    <th className="actions-header">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {budget.map(b => (
                    <tr key={b.id}>
                      <td>{formatDate(b.date)}</td>
                      <td>
                        <span className={`badge ${b.type === "income" ? "badge-öğrenci" : "badge-default"}`} style={{ 
                          background: b.type === "income" ? "#dcfce7" : "#fee2e2", 
                          color: b.type === "income" ? "#15803d" : "#dc2626" 
                        }}>
                          {b.type === "income" ? "Gelir / Sermaye" : "Gider"}
                        </span>
                      </td>
                      <td><strong>{b.category}</strong></td>
                      <td>
                        <span style={{ fontWeight: "bold", color: b.type === "income" ? "#16a34a" : "#dc2626" }}>
                          {b.type === "income" ? "+" : "-"}₺{Number(b.amount).toLocaleString("tr-TR")}
                        </span>
                      </td>
                      <td>{b.description || "-"}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn btn-icon btn-edit" onClick={() => {
                            setBudgetForm({
                              id: b.id,
                              type: b.type,
                              category: b.category,
                              amount: b.amount,
                              date: b.date || "",
                              description: b.description || ""
                            });
                            setShowBudgetForm(true);
                          }}>
                            Düzenle
                          </button>
                          <button className="btn btn-icon btn-delete" onClick={() => deleteBudget(b.id)}>
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
                <p>Henüz tanımlanmış bütçe girdisi bulunmamaktadır.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="pm-toast-container">
          <div className={`pm-toast toast-${toast.type}`}>
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectManagement;
