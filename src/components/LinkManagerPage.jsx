import React, { useMemo, useState } from "react";
import { Plus, X, Search, Trash2, MousePointerClick } from "lucide-react";
import { COLORS, inputStyle, todayIsoDate, monthLabel } from "../theme";

const EMPTY_FORM = { title: "", url: "", summary: "" };
const ROW_COLUMNS = "40px 90px 1.3fr 2fr 1.6fr 1.1fr 80px auto";

export default function LinkManagerPage({ records, currentUser, canDeleteAny, onPersist }) {
  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState("all");
  const [saverFilter, setSaverFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  const months = useMemo(
    () => Array.from(new Set(records.filter((r) => r.date).map((r) => r.date.slice(0, 7)))).sort(),
    [records]
  );
  const savers = useMemo(() => Array.from(new Set(records.map((r) => r.savedBy).filter(Boolean))).sort(), [records]);

  const visibleRecords = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      if (q && !r.title.toLowerCase().includes(q) && !(r.summary || "").toLowerCase().includes(q)) return false;
      if (monthFilter !== "all" && (r.date || "").slice(0, 7) !== monthFilter) return false;
      if (saverFilter !== "all" && r.savedBy !== saverFilter) return false;
      return true;
    });
  }, [records, search, monthFilter, saverFilter]);

  function addLink() {
    if (!form.title.trim() || !form.url.trim()) {
      setError("Nhập tên link và đường link trước đã.");
      return;
    }
    const newLink = {
      id: "lk_" + Date.now(),
      date: todayIsoDate(),
      title: form.title.trim(),
      url: form.url.trim(),
      summary: form.summary.trim(),
      savedBy: currentUser.name,
      clicks: 0,
    };
    onPersist([newLink, ...records]);
    setForm(EMPTY_FORM);
    setError("");
    setShowForm(false);
  }

  function removeLink(id) {
    onPersist(records.filter((r) => r.id !== id));
  }

  function registerClick(id) {
    onPersist(records.map((r) => (r.id === id ? { ...r, clicks: (r.clicks || 0) + 1 } : r)));
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
        <div>
          <h1 className="tb-title" style={{ fontSize: 26, fontWeight: 700, color: COLORS.ink, margin: 0 }}>Quản lý link</h1>
          <p style={{ color: COLORS.muted, fontSize: 14, margin: "4px 0 0" }}>Lưu trữ các link làm việc quan trọng của phòng</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          style={{
            display: "flex", alignItems: "center", gap: 6, background: COLORS.accentGrad, color: "#fff",
            border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}
        >
          <Plus size={16} /> Thêm link
        </button>
      </div>

      {showForm && (
        <div style={{ background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Link mới</span>
            <X size={18} style={{ cursor: "pointer", color: COLORS.muted }} onClick={() => setShowForm(false)} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 8, marginBottom: 8 }}>
            <input placeholder="Tên link" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputStyle} />
            <input placeholder="Đường link (https://...)" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input placeholder="Tóm tắt nội dung" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} style={inputStyle} />
            <button onClick={addLink} style={{ background: COLORS.ink, color: "#fff", border: "none", borderRadius: 6, padding: "9px 16px", fontSize: 14, cursor: "pointer", whiteSpace: "nowrap" }}>
              Lưu link
            </button>
          </div>
          {error && <div style={{ color: COLORS.danger, fontSize: 13, marginTop: 8 }}>{error}</div>}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 260px", minWidth: 220 }}>
          <Search size={15} color={COLORS.muted} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
          <input
            placeholder="Tìm theo tên link, từ khoá..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputStyle, paddingLeft: 32 }}
          />
        </div>
        <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} style={{ ...inputStyle, width: "auto", fontSize: 13 }}>
          <option value="all">Tất cả tháng lưu</option>
          {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
        </select>
        <select value={saverFilter} onChange={(e) => setSaverFilter(e.target.value)} style={{ ...inputStyle, width: "auto", fontSize: 13 }}>
          <option value="all">Tất cả người lưu</option>
          {savers.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 1100 }}>
          <div style={{
            display: "grid", gridTemplateColumns: ROW_COLUMNS, gap: 10,
            padding: "0 10px 8px", fontSize: 11, fontWeight: 600, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.4,
          }}>
            <span>TT</span><span>Ngày lưu</span><span>Tên link</span><span>Đường link</span><span>Tóm tắt nội dung</span><span>Người lưu</span><span>Lượt click</span><span />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {visibleRecords.map((r, i) => {
              const canDelete = canDeleteAny || r.savedBy === currentUser.name;
              return (
                <div
                  key={r.id}
                  className="tb-card"
                  style={{
                    display: "grid", gridTemplateColumns: ROW_COLUMNS, gap: 10, alignItems: "center",
                    background: "#fff", borderRadius: 8, border: `1px solid ${COLORS.border}`, padding: "10px", transition: "all 0.15s",
                  }}
                >
                  <span style={{ fontSize: 12.5, color: COLORS.muted }}>{i + 1}</span>
                  <span className="tb-mono" style={{ fontSize: 12, color: COLORS.muted }}>{r.date}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</span>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => registerClick(r.id)}
                    style={{ fontSize: 12, color: "#1D5FA8", wordBreak: "break-all", textDecoration: "underline" }}
                  >
                    {r.url}
                  </a>
                  <span style={{ fontSize: 12.5, color: COLORS.muted }}>{r.summary || "—"}</span>
                  <span style={{ fontSize: 12.5, color: COLORS.ink }}>{r.savedBy || "—"}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12.5, color: COLORS.muted }}>
                    <MousePointerClick size={12} /> {r.clicks || 0}
                  </span>
                  {canDelete ? (
                    <Trash2 size={14} style={{ cursor: "pointer", color: "#B08A9A", justifySelf: "end" }} onClick={() => removeLink(r.id)} />
                  ) : <span />}
                </div>
              );
            })}
            {visibleRecords.length === 0 && (
              <div style={{ fontSize: 13, color: COLORS.muted, textAlign: "center", padding: "24px 0", background: COLORS.surface, borderRadius: 8 }}>
                Chưa có link nào.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
