import React, { useState } from "react";
import { X, Send, CalendarDays } from "lucide-react";
import { COLORS, hashColor, initials, fmtDateTime, inputStyle } from "../theme";
import { CATEGORY_COLORS, STATUS_COLORS, STATUS_OPTIONS } from "../feedbackShared";

export default function FeedbackDetailModal({ record, currentUser, onUpdate, onClose }) {
  const [text, setText] = useState("");
  const comments = record.comments || [];
  const cat = CATEGORY_COLORS[record.category] || CATEGORY_COLORS["Khác"];

  function submit() {
    if (!text.trim()) return;
    const newComment = { id: "c" + Date.now(), author: currentUser.name, text: text.trim(), createdAt: new Date().toISOString() };
    onUpdate({ comments: [...comments, newComment] });
    setText("");
  }

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(43,20,32,0.45)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 16px", zIndex: 50, overflowY: "auto" }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, maxWidth: 600, width: "100%", padding: 24, marginBottom: 40 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 26, height: 26, borderRadius: "50%", background: hashColor(record.sender),
              color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              {initials(record.sender)}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink }}>{record.sender}</div>
              <div className="tb-mono" style={{ fontSize: 11, color: COLORS.muted, display: "flex", alignItems: "center", gap: 3 }}>
                <CalendarDays size={11} /> {record.date}
              </div>
            </div>
          </div>
          <X size={18} style={{ cursor: "pointer", color: COLORS.muted, flexShrink: 0 }} onClick={onClose} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: cat.fg, background: cat.bg, borderRadius: 4, padding: "2px 6px" }}>{record.category}</span>
          <select
            value={record.status}
            onChange={(e) => onUpdate({ status: e.target.value })}
            style={{
              fontSize: 11, fontWeight: 600, border: "none", borderRadius: 4, padding: "3px 6px",
              color: (STATUS_COLORS[record.status] || STATUS_COLORS[STATUS_OPTIONS[0]]).fg,
              background: (STATUS_COLORS[record.status] || STATUS_COLORS[STATUS_OPTIONS[0]]).bg,
            }}
          >
            {STATUS_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>

        <p style={{ fontSize: 14, color: COLORS.ink, lineHeight: 1.6, margin: "0 0 20px", whiteSpace: "pre-wrap" }}>{record.content}</p>

        <div>
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
      </div>
    </div>
  );
}
