import React, { useState } from "react";
import { Plus, X, MessageSquare, Send, Paperclip, Download } from "lucide-react";
import { COLORS, inputStyle, cardStyle, hashColor, initials, fmtDateTime, formatBytes, readFileAsDataUrl, MAX_ATTACHMENT_BYTES } from "../theme";

function emptyForm(fields) {
  const f = {};
  fields.forEach((field) => {
    f[field.key] = field.type === "select" ? (field.options?.[0] || "") : field.type === "file" ? null : "";
  });
  return f;
}

function FileField({ field, value, onChange }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setError(`File quá lớn (tối đa ${formatBytes(MAX_ATTACHMENT_BYTES)}).`);
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      onChange({ name: file.name, size: file.size, dataUrl });
      setError("");
    } catch {
      setError("Không đính kèm được file này.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <label style={{
        display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: value ? COLORS.ink : COLORS.muted,
        border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "8px 10px", cursor: "pointer", background: "#fff",
      }}>
        <Paperclip size={13} style={{ flexShrink: 0 }} />
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {value ? value.name : field.label + (field.required === false ? " (không bắt buộc)" : "")}
        </span>
        <input type="file" onChange={handleFile} disabled={busy} style={{ display: "none" }} />
      </label>
      {value && (
        <button type="button" onClick={() => onChange(null)} style={{ background: "none", border: "none", color: COLORS.danger, fontSize: 11, cursor: "pointer", padding: "3px 0" }}>
          Bỏ file này
        </button>
      )}
      {error && <div style={{ color: COLORS.danger, fontSize: 11, marginTop: 2 }}>{error}</div>}
    </div>
  );
}

function ReplyThread({ record, currentUser, statusField, onUpdate }) {
  const [text, setText] = useState("");
  const comments = record.comments || [];

  function submit() {
    if (!text.trim()) return;
    const newComment = { id: "c" + Date.now(), author: currentUser.name, text: text.trim(), createdAt: new Date().toISOString() };
    onUpdate({ comments: [...comments, newComment] });
    setText("");
  }

  return (
    <div style={{ background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 10, marginTop: -2 }}>
      {statusField && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, paddingBottom: 10, borderBottom: `1px solid ${COLORS.border}` }}>
          <span style={{ fontSize: 12, color: COLORS.muted }}>{statusField.label}:</span>
          <select
            value={record[statusField.key] || statusField.options[0]}
            onChange={(e) => onUpdate({ [statusField.key]: e.target.value })}
            style={{ fontSize: 12, padding: "4px 6px", border: `1px solid ${COLORS.border}`, borderRadius: 5, color: COLORS.ink }}
          >
            {statusField.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 }}>
        {comments.map((c) => (
          <div key={c.id} style={{ display: "flex", gap: 8 }}>
            <div style={{
              width: 20, height: 20, borderRadius: "50%", background: hashColor(c.author),
              color: "#fff", fontSize: 8, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              {initials(c.author)}
            </div>
            <div style={{ flex: 1, background: COLORS.surface, borderRadius: 8, padding: "6px 10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.ink }}>{c.author}</span>
                <span style={{ fontSize: 11, color: COLORS.muted }}>{fmtDateTime(c.createdAt)}</span>
              </div>
              <p style={{ fontSize: 12.5, color: COLORS.ink, margin: "2px 0 0", whiteSpace: "pre-wrap" }}>{c.text}</p>
            </div>
          </div>
        ))}
        {comments.length === 0 && <span style={{ fontSize: 12, color: COLORS.muted }}>Chưa có trả lời nào.</span>}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          placeholder="Trả lời…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          style={inputStyle}
        />
        <button onClick={submit} style={{ display: "flex", alignItems: "center", background: COLORS.ink, color: "#fff", border: "none", borderRadius: 6, padding: "0 14px", cursor: "pointer" }}>
          <Send size={13} />
        </button>
      </div>
    </div>
  );
}

export default function GenericModule({ config, records, users, currentUser, canManage, canAdd, onPersist }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(() => emptyForm(config.fields));
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const Icon = config.icon;
  const allowAdd = canAdd ?? canManage;

  function addRecord() {
    const missing = config.fields.some((f) => {
      if (f.required === false) return false;
      if (f.type === "file") return !form[f.key];
      return !String(form[f.key] || "").trim();
    });
    if (missing) {
      setError("Vui lòng điền đủ các trường bắt buộc.");
      return;
    }
    const newRecord = { id: config.key + "_" + Date.now(), comments: [] };
    config.fields.forEach((f) => { newRecord[f.key] = form[f.key]; });
    onPersist([newRecord, ...records]);
    setForm(emptyForm(config.fields));
    setError("");
    setShowForm(false);
  }

  function removeRecord(id) {
    onPersist(records.filter((r) => r.id !== id));
    if (expandedId === id) setExpandedId(null);
  }

  function updateRecord(id, patch) {
    onPersist(records.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  const listTemplate = config.fields.map((f) => (f.type === "textarea" ? "2fr" : "1fr")).join(" ") + " auto auto";

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 6, color: COLORS.ink }}>
          <Icon size={15} /> {config.label} ({records.length})
        </span>
        {allowAdd && (
          <button
            onClick={() => setShowForm((s) => !s)}
            style={{
              display: "flex", alignItems: "center", gap: 6, background: "#fff", color: COLORS.purple,
              border: `1px solid ${COLORS.purple}`, borderRadius: 8, padding: "7px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            <Plus size={14} /> Thêm mới
          </button>
        )}
      </div>

      {showForm && allowAdd && (
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8,
          marginBottom: 12, background: COLORS.surface, borderRadius: 8, padding: 10,
        }}>
          {config.fields.map((f) => (
            <div key={f.key} style={f.type === "textarea" ? { gridColumn: "1 / -1" } : undefined}>
              {f.type === "textarea" ? (
                <textarea
                  placeholder={f.label + (f.required === false ? " (không bắt buộc)" : "")}
                  value={form[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  rows={2}
                  style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
                />
              ) : f.type === "user" ? (
                <select
                  value={form[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  style={inputStyle}
                >
                  <option value="">{f.label}</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.name}>{u.name}</option>
                  ))}
                </select>
              ) : f.type === "select" ? (
                <select
                  value={form[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  style={inputStyle}
                >
                  {f.options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : f.type === "file" ? (
                <FileField field={f} value={form[f.key]} onChange={(v) => setForm({ ...form, [f.key]: v })} />
              ) : (
                <input
                  type={f.type}
                  placeholder={f.label + (f.required === false ? " (không bắt buộc)" : "")}
                  value={form[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  style={inputStyle}
                />
              )}
            </div>
          ))}
          <button
            onClick={addRecord}
            style={{ background: COLORS.ink, color: "#fff", border: "none", borderRadius: 6, padding: "9px 14px", fontSize: 14, cursor: "pointer" }}
          >
            Lưu
          </button>
        </div>
      )}
      {showForm && allowAdd && error && <div style={{ color: COLORS.danger, fontSize: 13, marginBottom: 10 }}>{error}</div>}

      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 640 }}>
          <div style={{
            display: "grid", gridTemplateColumns: listTemplate, gap: 10,
            padding: "0 10px 6px", fontSize: 11, fontWeight: 600, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.4,
          }}>
            {config.fields.map((f) => <span key={f.key}>{f.label}</span>)}
            <span /><span />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {records.map((r) => {
              const commentCount = (r.comments || []).length;
              const isExpanded = expandedId === r.id;
              return (
                <div key={r.id}>
                  <div
                    style={{
                      display: "grid", gridTemplateColumns: listTemplate, gap: 10, alignItems: "center",
                      background: COLORS.surface, borderRadius: isExpanded ? "8px 8px 0 0" : 8, padding: "9px 10px",
                    }}
                  >
                    {config.fields.map((f) => (
                      <span key={f.key} style={{ fontSize: 12.5, color: f.type === "user" ? COLORS.ink : COLORS.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: f.type === "textarea" ? "normal" : "nowrap" }}>
                        {f.type === "user" && r[f.key] ? (
                          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{
                              width: 18, height: 18, borderRadius: "50%", background: hashColor(r[f.key]),
                              color: "#fff", fontSize: 8, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                            }}>
                              {initials(r[f.key])}
                            </span>
                            {r[f.key]}
                          </span>
                        ) : f.type === "select" ? (
                          <select
                            value={r[f.key] || f.options[0]}
                            onChange={(e) => updateRecord(r.id, { [f.key]: e.target.value })}
                            style={{ fontSize: 12, padding: "3px 4px", border: `1px solid ${COLORS.border}`, borderRadius: 5, color: COLORS.ink, background: "#fff", maxWidth: "100%" }}
                          >
                            {f.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        ) : f.type === "file" ? (
                          r[f.key] ? (
                            <a
                              href={r[f.key].dataUrl} download={r[f.key].name}
                              style={{ display: "flex", alignItems: "center", gap: 4, color: COLORS.purple, textDecoration: "none" }}
                            >
                              <Download size={12} style={{ flexShrink: 0 }} />
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{r[f.key].name}</span>
                            </a>
                          ) : "—"
                        ) : (r[f.key] || "—")}
                      </span>
                    ))}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : r.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer",
                        color: isExpanded ? COLORS.purple : COLORS.muted, fontSize: 12, justifySelf: "start",
                      }}
                    >
                      <MessageSquare size={13} /> {commentCount > 0 ? commentCount : ""}
                    </button>
                    {canManage ? (
                      <X size={14} style={{ cursor: "pointer", color: "#B08A9A", justifySelf: "end" }} onClick={() => removeRecord(r.id)} />
                    ) : <span />}
                  </div>
                  {isExpanded && (
                    <ReplyThread
                      record={r}
                      currentUser={currentUser}
                      statusField={config.fields.find((f) => f.key === "status" && f.type === "select")}
                      onUpdate={(patch) => updateRecord(r.id, patch)}
                    />
                  )}
                </div>
              );
            })}
            {records.length === 0 && (
              <div style={{ fontSize: 13, color: COLORS.muted, textAlign: "center", padding: "20px 0" }}>Chưa có dữ liệu.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
