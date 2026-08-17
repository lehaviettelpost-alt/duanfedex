import React, { useState } from "react";
import { Paperclip, X, Trash2, Download } from "lucide-react";
import {
  COLORS, hashColor, initials, inputStyle, cardStyle,
  todayIsoDate, formatBytes, readFileAsDataUrl, MAX_ATTACHMENT_BYTES,
} from "../theme";

const FREQ_OPTIONS = ["Một lần", "Hàng ngày", "Hàng tuần", "Hàng tháng", "Hàng quý"];

const EMPTY_DOC = { docNumber: "", date: todayIsoDate(), title: "", signer: "", signerTitle: "", summary: "", attachment: null };

function emptyTaskRow() {
  return {
    id: "row_" + Date.now() + Math.random().toString(36).slice(2, 6),
    name: "", content: "", assigner: "", lead: "", weight: "", frequency: FREQ_OPTIONS[0],
    assignDate: todayIsoDate(), deadline: "",
  };
}

const taskCell = { padding: "5px 6px", border: `1px solid ${COLORS.border}`, borderRadius: 5, fontSize: 12, width: "100%" };
const TASK_COLUMNS = "1.3fr 1.5fr 1fr 1fr 0.7fr 0.9fr 0.9fr 0.9fr auto";

function AttendeeSelect({ value, onChange, users }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={taskCell}>
      <option value="">—</option>
      {users.map((u) => <option key={u.id} value={u.name}>{u.name}</option>)}
    </select>
  );
}

function VanBanDetailModal({ doc, onClose, onEdit, canManage }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(43,20,32,0.45)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 16px", zIndex: 50, overflowY: "auto" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, maxWidth: 720, width: "100%", padding: 24, marginBottom: 40 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 4 }}>
          <div>
            <span className="tb-mono" style={{ fontSize: 11, color: COLORS.muted }}>{doc.docNumber || "—"}</span>
            <h2 className="tb-title" style={{ fontSize: 18, fontWeight: 700, color: COLORS.ink, margin: "2px 0 0" }}>{doc.title}</h2>
          </div>
          <X size={18} style={{ cursor: "pointer", color: COLORS.muted, flexShrink: 0 }} onClick={onClose} />
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, margin: "10px 0 16px", fontSize: 12.5, color: COLORS.muted }}>
          <span>Ngày ban hành: <strong style={{ color: COLORS.ink }}>{doc.date}</strong></span>
          <span>Người ký: <strong style={{ color: COLORS.ink }}>{doc.signer || "—"}</strong></span>
          <span>Chức danh: <strong style={{ color: COLORS.ink }}>{doc.signerTitle || "—"}</strong></span>
        </div>

        {doc.summary && <p style={{ fontSize: 13.5, color: COLORS.ink, lineHeight: 1.6, whiteSpace: "pre-wrap", marginBottom: 16 }}>{doc.summary}</p>}

        {doc.attachment && (
          <a href={doc.attachment.dataUrl} download={doc.attachment.name} style={{ display: "flex", alignItems: "center", gap: 6, color: COLORS.purple, fontSize: 13, textDecoration: "none", marginBottom: 16 }}>
            <Download size={13} /> {doc.attachment.name} ({formatBytes(doc.attachment.size)})
          </a>
        )}

        <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8 }}>
          Việc đã giao từ văn bản ({(doc.tasks || []).length})
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
          {(doc.tasks || []).map((t) => (
            <div key={t.id} style={{ background: COLORS.surface, borderRadius: 8, padding: "8px 10px" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink }}>{t.name}</div>
              {t.content && <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>{t.content}</div>}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 4, fontSize: 11, color: COLORS.muted }}>
                {t.assigner && <span>Người giao: {t.assigner}</span>}
                {t.lead && <span>Chủ trì: {t.lead}</span>}
                {t.weight && <span>Trọng số: {t.weight}</span>}
                {t.frequency && <span>{t.frequency}</span>}
                {t.assignDate && <span>Giao: {t.assignDate}</span>}
                {t.deadline && <span>Hạn: {t.deadline}</span>}
              </div>
            </div>
          ))}
          {(!doc.tasks || doc.tasks.length === 0) && <span style={{ fontSize: 12, color: COLORS.muted }}>Chưa giao việc nào từ văn bản này.</span>}
        </div>

        {canManage && (
          <button onClick={onEdit} style={{ background: COLORS.ink, color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Chỉnh sửa
          </button>
        )}
      </div>
    </div>
  );
}

export default function VanBanPage({ records, users, canManage, onPersist }) {
  const [tab, setTab] = useState(() => (canManage ? "form" : "list"));
  const [docForm, setDocForm] = useState(EMPTY_DOC);
  const [activeDocId, setActiveDocId] = useState(null);
  const [taskRows, setTaskRows] = useState([]);
  const [docError, setDocError] = useState("");
  const [taskError, setTaskError] = useState("");
  const [attachError, setAttachError] = useState("");
  const [viewingId, setViewingId] = useState(null);

  function startNewDocument() {
    setDocForm(EMPTY_DOC);
    setActiveDocId(null);
    setTaskRows([]);
    setDocError("");
    setTaskError("");
  }

  function saveDocument() {
    if (!docForm.docNumber.trim() || !docForm.title.trim()) {
      setDocError("Nhập số văn bản và tiêu đề văn bản trước đã.");
      return;
    }
    if (activeDocId) {
      onPersist(records.map((r) => (r.id === activeDocId ? { ...r, ...docForm } : r)));
    } else {
      const newDoc = { id: "vb_" + Date.now(), ...docForm, tasks: [] };
      onPersist([newDoc, ...records]);
      setActiveDocId(newDoc.id);
    }
    setDocError("");
  }

  async function handleAttach(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setAttachError(`File quá lớn (tối đa ${formatBytes(MAX_ATTACHMENT_BYTES)}).`);
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setDocForm({ ...docForm, attachment: { name: file.name, size: file.size, dataUrl } });
      setAttachError("");
    } catch {
      setAttachError("Không đính kèm được file này.");
    }
  }

  function addTaskRow() {
    setTaskRows((prev) => [...prev, emptyTaskRow()]);
  }
  function updateTaskRow(id, patch) {
    setTaskRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function removeTaskRow(id) {
    setTaskRows((prev) => prev.filter((r) => r.id !== id));
  }

  function saveTasks() {
    if (!activeDocId) {
      setTaskError("Lưu văn bản trước khi giao việc.");
      return;
    }
    if (taskRows.length === 0) {
      setTaskError("Bấm \"Thêm dòng\" để tạo ít nhất một công việc.");
      return;
    }
    if (taskRows.some((r) => !r.name.trim())) {
      setTaskError("Nhập tên công việc cho tất cả các dòng.");
      return;
    }
    onPersist(records.map((r) => (r.id === activeDocId ? { ...r, tasks: [...(r.tasks || []), ...taskRows] } : r)));
    setTaskRows([]);
    setTaskError("");
  }

  function removeDoc(id) {
    onPersist(records.filter((r) => r.id !== id));
    if (activeDocId === id) startNewDocument();
    if (viewingId === id) setViewingId(null);
  }

  function editDoc(doc) {
    setDocForm({ docNumber: doc.docNumber, date: doc.date, title: doc.title, signer: doc.signer, signerTitle: doc.signerTitle, summary: doc.summary, attachment: doc.attachment || null });
    setActiveDocId(doc.id);
    setTaskRows([]);
    setViewingId(null);
    setTab("form");
  }

  const viewingDoc = records.find((r) => r.id === viewingId) || null;

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <h1 className="tb-title" style={{ fontSize: 26, fontWeight: 700, color: COLORS.ink, margin: 0 }}>Văn bản chỉ đạo</h1>
        <p style={{ color: COLORS.muted, fontSize: 14, margin: "4px 0 0" }}>Lưu văn bản đến/đi và giao việc từ nội dung văn bản</p>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          ...(canManage ? [{ key: "form", label: "Văn bản" }] : []),
          { key: "list", label: `Danh sách văn bản (${records.length})` },
        ].map((t) => {
          const isActive = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                background: isActive ? COLORS.ink : "#fff", color: isActive ? "#fff" : COLORS.ink,
                border: `1px solid ${isActive ? COLORS.ink : COLORS.border}`, borderRadius: 8, padding: "9px 16px",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "form" && canManage && (
        <div style={cardStyle}>
          {activeDocId && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, background: COLORS.surface, borderRadius: 8, padding: "8px 12px" }}>
              <span style={{ fontSize: 12.5, color: COLORS.ink }}>Đang chỉnh sửa văn bản đã lưu.</span>
              <button onClick={startNewDocument} style={{ background: "none", border: "none", color: COLORS.purple, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                + Tạo văn bản mới
              </button>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>Số văn bản</label>
              <input placeholder="VD: 123/CV-VTP" value={docForm.docNumber} onChange={(e) => setDocForm({ ...docForm, docNumber: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>Ngày ban hành</label>
              <input type="date" value={docForm.date} onChange={(e) => setDocForm({ ...docForm, date: e.target.value })} style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>Tiêu đề văn bản</label>
            <input placeholder="VD: Công văn/Chỉ thị về..." value={docForm.title} onChange={(e) => setDocForm({ ...docForm, title: e.target.value })} style={inputStyle} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>Người ký</label>
              <input placeholder="VD: Nguyễn Văn A" value={docForm.signer} onChange={(e) => setDocForm({ ...docForm, signer: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>Chức danh</label>
              <input placeholder="VD: Tổng Giám đốc" value={docForm.signerTitle} onChange={(e) => setDocForm({ ...docForm, signerTitle: e.target.value })} style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>Nội dung tóm tắt</label>
            <textarea
              placeholder="Tóm tắt nội dung chính của văn bản..."
              value={docForm.summary}
              onChange={(e) => setDocForm({ ...docForm, summary: e.target.value })}
              rows={4}
              style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <button onClick={saveDocument} style={{ background: COLORS.accentGrad, color: "#fff", border: "none", borderRadius: 6, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Lưu văn bản
            </button>
            <label style={{ display: "flex", alignItems: "center", gap: 6, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "9px 14px", fontSize: 13, color: COLORS.ink, cursor: "pointer" }}>
              <Paperclip size={14} /> {docForm.attachment ? docForm.attachment.name : "Đính kèm file"}
              <input type="file" onChange={handleAttach} style={{ display: "none" }} />
            </label>
            {docForm.attachment && (
              <X size={14} style={{ cursor: "pointer", color: COLORS.muted }} onClick={() => setDocForm({ ...docForm, attachment: null })} />
            )}
          </div>
          {docError && <div style={{ color: COLORS.danger, fontSize: 13, marginTop: 6 }}>{docError}</div>}
          {attachError && <div style={{ color: COLORS.danger, fontSize: 13, marginTop: 6 }}>{attachError}</div>}

          <div style={{ marginTop: 22, paddingTop: 18, borderTop: `1px solid ${COLORS.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 10 }}>
              Giao việc từ văn bản
            </div>

            <div style={{ overflowX: "auto" }}>
              <div style={{ minWidth: 920 }}>
                <div style={{ display: "grid", gridTemplateColumns: TASK_COLUMNS, gap: 8, padding: "0 4px 6px", fontSize: 10.5, fontWeight: 700, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.3 }}>
                  <span>Tên công việc</span><span>Nội dung cụ thể</span><span>Người giao</span><span>Chủ trì</span><span>Trọng số CV</span><span>Tần suất</span><span>Ngày giao</span><span>Deadline</span><span />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {taskRows.map((row) => (
                    <div key={row.id} style={{ display: "grid", gridTemplateColumns: TASK_COLUMNS, gap: 8, alignItems: "center" }}>
                      <input value={row.name} onChange={(e) => updateTaskRow(row.id, { name: e.target.value })} style={taskCell} placeholder="Tên công việc" />
                      <input value={row.content} onChange={(e) => updateTaskRow(row.id, { content: e.target.value })} style={taskCell} placeholder="Nội dung cụ thể" />
                      <AttendeeSelect value={row.assigner} onChange={(v) => updateTaskRow(row.id, { assigner: v })} users={users} />
                      <AttendeeSelect value={row.lead} onChange={(v) => updateTaskRow(row.id, { lead: v })} users={users} />
                      <input type="number" value={row.weight} onChange={(e) => updateTaskRow(row.id, { weight: e.target.value })} style={taskCell} placeholder="%" />
                      <select value={row.frequency} onChange={(e) => updateTaskRow(row.id, { frequency: e.target.value })} style={taskCell}>
                        {FREQ_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                      </select>
                      <input type="date" value={row.assignDate} onChange={(e) => updateTaskRow(row.id, { assignDate: e.target.value })} style={taskCell} />
                      <input type="date" value={row.deadline} onChange={(e) => updateTaskRow(row.id, { deadline: e.target.value })} style={taskCell} />
                      <X size={14} style={{ cursor: "pointer", color: "#B08A9A", justifySelf: "center" }} onClick={() => removeTaskRow(row.id)} />
                    </div>
                  ))}
                  {taskRows.length === 0 && (
                    <div style={{ fontSize: 12.5, color: COLORS.muted, padding: "6px 4px" }}>
                      Chưa có nhiệm vụ nào — bấm "Thêm dòng" để giao việc
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
              <button onClick={addTaskRow} style={{ background: "#fff", color: COLORS.ink, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                + Thêm dòng
              </button>
            </div>
            <button onClick={saveTasks} style={{ marginTop: 14, background: COLORS.accentGrad, color: "#fff", border: "none", borderRadius: 6, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Lưu giao việc
            </button>
            {taskError && <div style={{ color: COLORS.danger, fontSize: 13, marginTop: 8 }}>{taskError}</div>}
          </div>
        </div>
      )}

      {tab === "list" && (
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 780 }}>
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 2fr 0.9fr 1.2fr 0.9fr auto",
              gap: 12, padding: "0 12px 8px", fontSize: 11, fontWeight: 600, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.4,
            }}>
              <span>Số văn bản</span><span>Tiêu đề</span><span>Ngày ban hành</span><span>Người ký</span><span>Việc giao</span><span />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {records.map((doc) => (
                <div
                  key={doc.id}
                  className="tb-card"
                  style={{
                    display: "grid", gridTemplateColumns: "1fr 2fr 0.9fr 1.2fr 0.9fr auto", gap: 12, alignItems: "center",
                    background: "#fff", borderRadius: 8, border: `1px solid ${COLORS.border}`, borderLeft: `4px solid ${COLORS.purple}`,
                    padding: "10px 12px", transition: "all 0.15s",
                  }}
                >
                  <button onClick={() => setViewingId(doc.id)} className="tb-mono" style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", fontSize: 12.5, color: COLORS.ink }}>
                    {doc.docNumber || "—"}
                  </button>
                  <span style={{ fontSize: 13, color: COLORS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.title}</span>
                  <span className="tb-mono" style={{ fontSize: 12, color: COLORS.muted }}>{doc.date}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                    {doc.signer && (
                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: hashColor(doc.signer), color: "#fff", fontSize: 8, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {initials(doc.signer)}
                      </div>
                    )}
                    <span style={{ fontSize: 12, color: COLORS.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.signer || "—"}</span>
                  </div>
                  <span style={{ fontSize: 12, color: COLORS.muted }}>{(doc.tasks || []).length} việc</span>
                  {canManage ? (
                    <Trash2 size={14} style={{ cursor: "pointer", color: "#B08A9A", justifySelf: "end" }} onClick={() => removeDoc(doc.id)} />
                  ) : <span />}
                </div>
              ))}
              {records.length === 0 && (
                <div style={{ fontSize: 13, color: COLORS.muted, textAlign: "center", padding: "24px 0", background: COLORS.surface, borderRadius: 8 }}>
                  Chưa có văn bản nào.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {viewingDoc && (
        <VanBanDetailModal doc={viewingDoc} onClose={() => setViewingId(null)} onEdit={() => editDoc(viewingDoc)} canManage={canManage} />
      )}
    </>
  );
}
