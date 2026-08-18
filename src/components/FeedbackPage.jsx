import React, { useState } from "react";
import { Plus, Trash2, X, MessageSquare, CalendarDays, Send, ChevronDown, ChevronUp } from "lucide-react";
import { COLORS, hashColor, initials, inputStyle, cardStyle, todayIsoDate, fmtDateTime } from "../theme";
import { CATEGORY_OPTIONS, STATUS_OPTIONS, CATEGORY_COLORS, STATUS_COLORS } from "../feedbackShared";

function ReplyPanel({ record, currentUser, onUpdate }) {
  const [text, setText] = useState("");
  const comments = record.comments || [];

  function submit() {
    if (!text.trim()) return;
    const newComment = { id: "c" + Date.now(), author: currentUser.name, text: text.trim(), createdAt: new Date().toISOString() };
    onUpdate({ comments: [...comments, newComment] });
    setText("");
  }

  return (
    <div style={{ borderTop: `1px solid ${COLORS.border}`, marginTop: 10, paddingTop: 12 }}>
      <p style={{ fontSize: 13.5, color: COLORS.ink, lineHeight: 1.6, margin: "0 0 14px", whiteSpace: "pre-wrap" }}>{record.content}</p>

      <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8 }}>
        Trả lời ({comments.length})
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 10 }}>
        {comments.map((c) => (
          <div key={c.id} style={{ display: "flex", gap: 8 }}>
            <div style={{
              width: 22, height: 22, borderRadius: "50%", background: hashColor(c.author),
              color: "#fff", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              {initials(c.author)}
            </div>
            <div style={{ flex: 1, background: COLORS.surface, borderRadius: 8, padding: "6px 10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.ink }}>{c.author}</span>
                <span style={{ fontSize: 11, color: COLORS.muted }}>{fmtDateTime(c.createdAt)}</span>
              </div>
              <p style={{ fontSize: 13, color: COLORS.ink, margin: "2px 0 0", whiteSpace: "pre-wrap" }}>{c.text}</p>
            </div>
          </div>
        ))}
        {comments.length === 0 && <span style={{ fontSize: 12, color: COLORS.muted }}>Chưa có trả lời nào.</span>}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          placeholder="Viết trả lời…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          style={inputStyle}
        />
        <button onClick={submit} style={{ display: "flex", alignItems: "center", gap: 6, background: COLORS.ink, color: "#fff", border: "none", borderRadius: 6, padding: "0 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          <Send size={13} />
        </button>
      </div>
    </div>
  );
}

export default function FeedbackPage({ records, users, currentUser, canManage, onPersist }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ content: "", sender: "", category: CATEGORY_OPTIONS[0], date: todayIsoDate() });
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  function addFeedback() {
    if (!form.content.trim() || !form.sender.trim()) {
      setError("Nhập nội dung và người gửi trước đã.");
      return;
    }
    const newRecord = {
      id: "feedback_" + Date.now(),
      date: form.date || todayIsoDate(),
      sender: form.sender.trim(),
      category: form.category,
      content: form.content.trim(),
      status: STATUS_OPTIONS[0],
      comments: [],
    };
    onPersist([newRecord, ...records]);
    setForm({ content: "", sender: "", category: CATEGORY_OPTIONS[0], date: todayIsoDate() });
    setError("");
    setShowForm(false);
  }

  function updateStatus(id, status) {
    onPersist(records.map((r) => (r.id === id ? { ...r, status } : r)));
  }

  function removeRecord(id) {
    onPersist(records.filter((r) => r.id !== id));
    if (expandedId === id) setExpandedId(null);
  }

  function updateRecord(id, patch) {
    onPersist(records.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
        <div>
          <h1 className="tb-title" style={{ fontSize: 26, fontWeight: 700, color: COLORS.ink, margin: 0 }}>Ý kiến phản hồi ({records.length})</h1>
          <p style={{ color: COLORS.muted, fontSize: 14, margin: "4px 0 0" }}>Gửi và trao đổi góp ý, khiếu nại, đề xuất</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          style={{
            display: "flex", alignItems: "center", gap: 6, background: COLORS.accentGrad, color: "#fff",
            border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}
        >
          <Plus size={16} /> Gửi phản hồi
        </button>
      </div>

      {showForm && (
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Phản hồi mới</span>
            <X size={18} style={{ cursor: "pointer", color: COLORS.muted }} onClick={() => setShowForm(false)} />
          </div>
          <textarea
            placeholder="Nội dung phản hồi"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            rows={2}
            style={{ ...inputStyle, resize: "vertical", marginBottom: 8 }}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 8, alignItems: "center" }}>
            <select value={form.sender} onChange={(e) => setForm({ ...form, sender: e.target.value })} style={inputStyle}>
              <option value="">Người gửi</option>
              {users.map((u) => <option key={u.id} value={u.name}>{u.name}</option>)}
            </select>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={inputStyle}>
              {CATEGORY_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={inputStyle} />
            <button onClick={addFeedback} style={{ background: COLORS.ink, color: "#fff", border: "none", borderRadius: 6, padding: "8px 14px", fontSize: 14, cursor: "pointer" }}>
              Gửi
            </button>
          </div>
          {error && <div style={{ color: COLORS.danger, fontSize: 13, marginTop: 8 }}>{error}</div>}
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 800 }}>
          <div style={{
            display: "grid", gridTemplateColumns: "2.2fr 1.2fr 0.9fr 0.9fr 1.1fr auto",
            gap: 12, padding: "0 12px 8px", fontSize: 11, fontWeight: 600, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.4,
          }}>
            <span>Nội dung</span><span>Người gửi</span><span>Loại</span><span>Ngày</span><span>Trạng thái</span><span />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {records.map((r) => {
              const cat = CATEGORY_COLORS[r.category] || CATEGORY_COLORS["Khác"];
              const commentCount = (r.comments || []).length;
              const isExpanded = expandedId === r.id;
              return (
                <div
                  key={r.id}
                  className="tb-card"
                  style={{
                    background: "#fff", borderRadius: 8, border: `1px solid ${COLORS.border}`,
                    borderLeft: `4px solid ${cat.fg}`, padding: "10px 12px", transition: "all 0.15s",
                  }}
                >
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : r.id)}
                    style={{ display: "grid", gridTemplateColumns: "2.2fr 1.2fr 0.9fr 0.9fr 1.1fr auto", gap: 12, alignItems: "center", cursor: "pointer" }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontSize: 13.5, color: COLORS.ink, lineHeight: 1.4 }}>
                        {r.content.length > 90 ? r.content.slice(0, 90) + "…" : r.content}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 3, fontSize: 11, color: COLORS.muted }}>
                        <MessageSquare size={11} /> {commentCount > 0 ? commentCount : "Trả lời"}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: "50%", background: hashColor(r.sender),
                        color: "#fff", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        {initials(r.sender)}
                      </div>
                      <span style={{ fontSize: 12, color: COLORS.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.sender}</span>
                    </div>

                    <span style={{ fontSize: 11, fontWeight: 600, color: cat.fg, background: cat.bg, borderRadius: 4, padding: "2px 6px", justifySelf: "start" }}>
                      {r.category}
                    </span>

                    <span className="tb-mono" style={{ fontSize: 11, color: COLORS.muted, display: "flex", alignItems: "center", gap: 3 }}>
                      <CalendarDays size={11} /> {r.date}
                    </span>

                    <select
                      value={r.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => updateStatus(r.id, e.target.value)}
                      style={{
                        fontSize: 11, fontWeight: 600, border: "none", borderRadius: 5, padding: "5px 6px",
                        color: (STATUS_COLORS[r.status] || STATUS_COLORS[STATUS_OPTIONS[0]]).fg,
                        background: (STATUS_COLORS[r.status] || STATUS_COLORS[STATUS_OPTIONS[0]]).bg,
                      }}
                    >
                      {STATUS_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>

                    <div style={{ display: "flex", alignItems: "center", gap: 8, justifySelf: "end" }}>
                      {canManage && (
                        <Trash2 size={14} style={{ cursor: "pointer", color: "#B08A9A", flexShrink: 0 }} onClick={(e) => { e.stopPropagation(); removeRecord(r.id); }} />
                      )}
                      {isExpanded ? <ChevronUp size={16} color={COLORS.muted} /> : <ChevronDown size={16} color={COLORS.muted} />}
                    </div>
                  </div>

                  {isExpanded && (
                    <ReplyPanel record={r} currentUser={currentUser} onUpdate={(patch) => updateRecord(r.id, patch)} />
                  )}
                </div>
              );
            })}
            {records.length === 0 && (
              <div style={{ fontSize: 13, color: COLORS.muted, textAlign: "center", padding: "24px 0", background: "#F0E1E8", borderRadius: 8 }}>
                Chưa có phản hồi nào.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
