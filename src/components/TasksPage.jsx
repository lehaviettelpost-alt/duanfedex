import React, { useMemo, useState } from "react";
import { Plus, Trash2, X, Search, AlertTriangle, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import {
  COLORS, PRIORITIES, STATUSES, DASHBOARD_TILES, STATUS_BAR_COLORS, DEADLINE_HEALTH,
  isOverdue, getDeadlineHealth, todayIsoDate, nextTaskCode, monthLabel, inputStyle, cardStyle,
} from "../theme";
import { ClipboardList, Clock, CheckCircle2 } from "lucide-react";
import TaskDetailPanel, { FREQUENCY_OPTIONS } from "./TaskDetailPanel";

const HEALTH_FILTERS = ["overdue", "due", "ontrack"];

export default function TasksPage({ tasks, users, currentUser, isAdmin, canManageTasks, onPersistTasks }) {
  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [pillFilter, setPillFilter] = useState("all"); // "all" | "status:<key>" | "health:<key>"
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", assignee: "", priority: "medium", assignedDate: todayIsoDate(), deadline: "",
    assigner: "", frequency: FREQUENCY_OPTIONS[0], collaborators: "",
  });
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const assignees = useMemo(() => Array.from(new Set(tasks.map((t) => t.assignee))).sort(), [tasks]);
  const months = useMemo(
    () => Array.from(new Set(tasks.filter((t) => t.deadline).map((t) => t.deadline.slice(0, 7)))).sort(),
    [tasks]
  );

  const baseFilteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => {
      if (q && !t.title.toLowerCase().includes(q) && !(t.code || "").toLowerCase().includes(q)) return false;
      if (monthFilter !== "all" && (t.deadline || "").slice(0, 7) !== monthFilter) return false;
      if (assigneeFilter !== "all" && t.assignee !== assigneeFilter) return false;
      return true;
    });
  }, [tasks, search, monthFilter, assigneeFilter]);

  const pillCounts = useMemo(() => {
    const counts = { all: baseFilteredTasks.length };
    STATUSES.forEach((s) => { counts[`status:${s.key}`] = baseFilteredTasks.filter((t) => t.status === s.key).length; });
    HEALTH_FILTERS.forEach((h) => { counts[`health:${h}`] = baseFilteredTasks.filter((t) => getDeadlineHealth(t.deadline, t.status) === h).length; });
    return counts;
  }, [baseFilteredTasks]);

  const visibleTasks = useMemo(() => {
    if (pillFilter === "all") return baseFilteredTasks;
    const [type, value] = pillFilter.split(":");
    if (type === "status") return baseFilteredTasks.filter((t) => t.status === value);
    return baseFilteredTasks.filter((t) => getDeadlineHealth(t.deadline, t.status) === value);
  }, [baseFilteredTasks, pillFilter]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const byStatus = STATUSES.reduce((acc, s) => {
      acc[s.key] = tasks.filter((t) => t.status === s.key).length;
      return acc;
    }, {});
    const overdue = tasks.filter((t) => isOverdue(t.deadline, t.status)).length;
    return { total, byStatus, done: byStatus.done, doing: byStatus.doing, overdue };
  }, [tasks]);

  function notifyAssignee(task) {
    const assigneeUser = users.find((u) => u.name === task.assignee);
    if (!assigneeUser?.email) return;
    fetch("/api/send-task-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assigneeEmail: assigneeUser.email,
        assigneeName: assigneeUser.name,
        assignerName: currentUser.name,
        assignerEmail: currentUser.email,
        taskCode: task.code,
        title: task.title,
        description: task.description,
        priority: task.priority,
        assignedDate: task.assignedDate,
        deadline: task.deadline,
      }),
    }).catch(() => {
      // best effort — việc vẫn được tạo dù gửi email thất bại (mất mạng, chưa cấu hình...)
    });
  }

  function addTask() {
    if (!form.title.trim() || !form.assignee.trim()) {
      setError("Nhập tên công việc và người phụ trách trước đã.");
      return;
    }
    const newTask = {
      id: "t" + Date.now(),
      code: nextTaskCode(tasks),
      title: form.title.trim(),
      description: form.description.trim(),
      assignee: form.assignee.trim(),
      priority: form.priority,
      status: "todo",
      assignedDate: form.assignedDate || todayIsoDate(),
      deadline: form.deadline,
      assigner: form.assigner.trim(),
      frequency: form.frequency,
      collaborators: form.collaborators.trim(),
      source: "Giao việc mới",
      comments: [],
      attachments: [],
      result: null,
    };
    onPersistTasks([newTask, ...tasks]);
    notifyAssignee(newTask);
    setForm({
      title: "", description: "", assignee: "", priority: "medium", assignedDate: todayIsoDate(), deadline: "",
      assigner: "", frequency: FREQUENCY_OPTIONS[0], collaborators: "",
    });
    setError("");
    setShowForm(false);
  }

  function removeTask(id) {
    onPersistTasks(tasks.filter((t) => t.id !== id));
    if (expandedId === id) setExpandedId(null);
  }

  function updateTask(id, patch) {
    onPersistTasks(tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
        <div>
          <h1 className="tb-title" style={{ fontSize: 26, fontWeight: 700, color: COLORS.ink, margin: 0 }}>Công việc</h1>
          <p style={{ color: COLORS.muted, fontSize: 14, margin: "4px 0 0" }}>Giao việc, cập nhật tiến độ và trạng thái</p>
        </div>
        {canManageTasks && (
          <button
            onClick={() => setShowForm((s) => !s)}
            style={{
              display: "flex", alignItems: "center", gap: 6, background: COLORS.accentGrad, color: "#fff",
              border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}
          >
            <Plus size={16} /> Giao việc mới
          </button>
        )}
      </div>

      <div style={cardStyle}>
        <span style={{ fontWeight: 600, fontSize: 14, color: COLORS.ink, display: "block", marginBottom: 12 }}>Tổng quan tiến độ</span>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 16 }}>
          {[
            { key: "total", value: stats.total, icon: ClipboardList },
            { key: "doing", value: stats.doing, icon: Clock },
            { key: "done", value: stats.done, icon: CheckCircle2 },
            { key: "overdue", value: stats.overdue, icon: AlertTriangle },
          ].map(({ key, value, icon: Icon }) => {
            const c = DASHBOARD_TILES[key];
            return (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 10, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: c.bg, color: c.fg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={17} />
                </div>
                <div>
                  <div className="tb-title" style={{ fontSize: 20, fontWeight: 700, color: c.fg }}>{value}</div>
                  <div style={{ fontSize: 12, color: COLORS.muted }}>{c.label}</div>
                </div>
              </div>
            );
          })}
        </div>

        {stats.total > 0 && (
          <div style={{ display: "flex", width: "100%", height: 10, borderRadius: 6, overflow: "hidden" }}>
            {STATUSES.map((s) => {
              const count = stats.byStatus[s.key];
              if (!count) return null;
              return <div key={s.key} title={`${s.label}: ${count}`} style={{ width: `${(count / stats.total) * 100}%`, background: STATUS_BAR_COLORS[s.key] }} />;
            })}
          </div>
        )}
      </div>

      {showForm && canManageTasks && (
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Công việc mới</span>
            <X size={18} style={{ cursor: "pointer", color: COLORS.muted }} onClick={() => setShowForm(false)} />
          </div>
          <textarea
            placeholder="Nội dung công việc giao (không bắt buộc)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            style={{ ...inputStyle, resize: "vertical", marginBottom: 8 }}
          />
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <input placeholder="Tên công việc" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputStyle} />
            <select value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })} style={inputStyle}>
              <option value="">Người phụ trách</option>
              {users.map((u) => <option key={u.id} value={u.name}>{u.name}</option>)}
            </select>
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} style={inputStyle}>
              {Object.entries(PRIORITIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, color: COLORS.muted, marginBottom: 3 }}>Ngày giao</label>
              <input type="date" value={form.assignedDate} onChange={(e) => setForm({ ...form, assignedDate: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, color: COLORS.muted, marginBottom: 3 }}>Ngày kết thúc</label>
              <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} style={inputStyle} />
            </div>
            <button onClick={addTask} style={{ alignSelf: "end", background: COLORS.ink, color: "#fff", border: "none", borderRadius: 6, padding: "8px 14px", fontSize: 14, cursor: "pointer" }}>
              Thêm
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, alignItems: "center" }}>
            <div>
              <label style={{ display: "block", fontSize: 11, color: COLORS.muted, marginBottom: 3 }}>Người giao</label>
              <input placeholder="VD: GĐTT" value={form.assigner} onChange={(e) => setForm({ ...form, assigner: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, color: COLORS.muted, marginBottom: 3 }}>Tần suất</label>
              <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} style={inputStyle}>
                {FREQUENCY_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, color: COLORS.muted, marginBottom: 3 }}>Phối hợp</label>
              <input placeholder="Người phối hợp (nếu có)" value={form.collaborators} onChange={(e) => setForm({ ...form, collaborators: e.target.value })} style={inputStyle} />
            </div>
          </div>
          {error && <div style={{ color: COLORS.danger, fontSize: 13, marginTop: 8 }}>{error}</div>}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 260px", minWidth: 220 }}>
          <Search size={15} color={COLORS.muted} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
          <input
            placeholder="Tìm theo tên việc, mã CV…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputStyle, paddingLeft: 32 }}
          />
        </div>
        <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} style={{ ...inputStyle, width: "auto", fontSize: 13 }}>
          <option value="all">Tất cả các tháng</option>
          {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
        </select>
        <select value={pillFilter} onChange={(e) => setPillFilter(e.target.value)} style={{ ...inputStyle, width: "auto", fontSize: 13 }}>
          <option value="all">Tất cả tiến độ</option>
          {STATUSES.map((s) => <option key={s.key} value={`status:${s.key}`}>{s.label}</option>)}
          {HEALTH_FILTERS.map((h) => <option key={h} value={`health:${h}`}>{DEADLINE_HEALTH[h].label}</option>)}
        </select>
        <select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)} style={{ ...inputStyle, width: "auto", fontSize: 13 }}>
          <option value="all">Tất cả nhân sự</option>
          {assignees.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <span style={{ fontSize: 13, color: COLORS.muted, whiteSpace: "nowrap" }}>{baseFilteredTasks.length} việc</span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {[
          { key: "all", label: "Tất cả" },
          ...STATUSES.map((s) => ({ key: `status:${s.key}`, label: s.label })),
          ...HEALTH_FILTERS.map((h) => ({ key: `health:${h}`, label: DEADLINE_HEALTH[h].label })),
        ].map((chip) => {
          const isActive = pillFilter === chip.key;
          return (
            <button
              key={chip.key}
              onClick={() => setPillFilter(chip.key)}
              style={{
                display: "flex", alignItems: "center", gap: 5, border: "none", borderRadius: 999, padding: "6px 12px", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                background: isActive ? COLORS.accentGrad : COLORS.surface,
                color: isActive ? "#fff" : COLORS.ink,
              }}
            >
              {chip.label} <span style={{ opacity: 0.8 }}>({pillCounts[chip.key] || 0})</span>
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {visibleTasks.map((t) => {
          const p = PRIORITIES[t.priority];
          const health = getDeadlineHealth(t.deadline, t.status);
          const healthInfo = health ? DEADLINE_HEALTH[health] : null;
          const statusInfo = STATUSES.find((s) => s.key === t.status);
          const isExpanded = expandedId === t.id;
          return (
            <div
              key={t.id}
              className="tb-card"
              style={{ background: "#fff", borderRadius: 10, border: `1px solid ${COLORS.border}`, borderLeft: `4px solid ${p.fg}`, padding: "12px 14px", transition: "all 0.15s" }}
            >
              <div
                onClick={() => setExpandedId(isExpanded ? null : t.id)}
                style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, cursor: "pointer" }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                    {t.code && (
                      <span className="tb-mono" style={{ fontSize: 10.5, fontWeight: 700, color: COLORS.muted, background: COLORS.surface, borderRadius: 4, padding: "1px 6px" }}>
                        {t.code}
                      </span>
                    )}
                    <span style={{ fontSize: 14.5, fontWeight: 600, color: COLORS.ink, lineHeight: 1.3 }}>{t.title}</span>
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.muted }}>
                    Chủ trì: {t.assignee || "—"} · Trọng số CV: {p.label}
                    {t.assignedDate && ` · Ngày giao: ${t.assignedDate}`}
                    {t.deadline && ` · Deadline: ${t.deadline}`}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  {healthInfo && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: healthInfo.fg, background: healthInfo.bg, borderRadius: 999, padding: "3px 9px", display: "flex", alignItems: "center", gap: 3 }}>
                      {health === "overdue" && <AlertTriangle size={11} />}
                      {healthInfo.label}
                    </span>
                  )}
                  <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.ink, background: COLORS.surface, borderRadius: 999, padding: "3px 9px" }}>
                    {statusInfo?.label}
                  </span>
                  {(t.comments?.length || 0) > 0 && (
                    <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: COLORS.muted }}>
                      <MessageSquare size={12} /> {t.comments.length}
                    </span>
                  )}
                  {canManageTasks && (
                    <Trash2
                      size={14}
                      style={{ cursor: "pointer", color: "#B08A9A", flexShrink: 0 }}
                      onClick={(e) => { e.stopPropagation(); removeTask(t.id); }}
                    />
                  )}
                  {isExpanded ? <ChevronUp size={17} color={COLORS.muted} /> : <ChevronDown size={17} color={COLORS.muted} />}
                </div>
              </div>

              {isExpanded && (
                <TaskDetailPanel
                  task={t}
                  currentUser={currentUser}
                  isAdmin={isAdmin}
                  canManageTasks={canManageTasks}
                  onUpdate={(patch) => updateTask(t.id, patch)}
                />
              )}
            </div>
          );
        })}
        {visibleTasks.length === 0 && (
          <div style={{ fontSize: 13, color: COLORS.muted, textAlign: "center", padding: "24px 0", background: "#F0E1E8", borderRadius: 8 }}>
            Không có việc
          </div>
        )}
      </div>
    </>
  );
}
