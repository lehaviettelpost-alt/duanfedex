import React, { useState } from "react";
import { Paperclip, Download, CheckCircle2, RotateCcw, XCircle, PauseCircle, Ban, Pencil } from "lucide-react";
import {
  COLORS, inputStyle, formatBytes, readFileAsDataUrl, fmtDateTime, MAX_ATTACHMENT_BYTES,
  hashColor, initials, PRIORITIES,
} from "../theme";

export const FREQUENCY_OPTIONS = ["Một lần", "Hàng ngày", "Hàng tuần", "Hàng tháng", "Hàng quý", "Hàng năm"];

function Field({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink }}>{value || "—"}</div>
    </div>
  );
}

function UpdateAttachment({ att }) {
  return (
    <a
      href={att.dataUrl}
      download={att.name}
      style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", borderRadius: 6, padding: "4px 8px", fontSize: 11.5, color: COLORS.ink, textDecoration: "none", marginTop: 4, width: "fit-content" }}
    >
      <Paperclip size={11} color={COLORS.muted} />
      <span>{att.name}</span>
      <span style={{ color: COLORS.muted }}>({formatBytes(att.size)})</span>
      <Download size={11} color={COLORS.muted} />
    </a>
  );
}

export default function TaskDetailPanel({ task, currentUser, canManageTasks, onUpdate }) {
  const [updateText, setUpdateText] = useState("");
  const [pendingFile, setPendingFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [showExtend, setShowExtend] = useState(false);
  const [extendDate, setExtendDate] = useState("");

  const isAssignee = task.assignee === currentUser.name;
  const canAct = canManageTasks || isAssignee;
  const updates = task.comments || [];

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setFileError(`File quá lớn (tối đa ${formatBytes(MAX_ATTACHMENT_BYTES)}).`);
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setPendingFile({ name: file.name, size: file.size, dataUrl });
      setFileError("");
    } catch {
      setFileError("Không đính kèm được file này.");
    } finally {
      setBusy(false);
    }
  }

  function addUpdate() {
    if (!updateText.trim() && !pendingFile) return;
    const entry = {
      id: "c" + Date.now(), author: currentUser.name, text: updateText.trim(),
      createdAt: new Date().toISOString(), attachment: pendingFile || null,
    };
    onUpdate({ comments: [...updates, entry] });
    setUpdateText("");
    setPendingFile(null);
  }

  function logSystemNote(text) {
    return [...updates, { id: "c" + Date.now(), author: currentUser.name, text, createdAt: new Date().toISOString(), system: true }];
  }

  function markDone() { onUpdate({ status: "done" }); }
  function markNotDone() { onUpdate({ status: "doing" }); }
  function proposePause() { onUpdate({ status: "paused", comments: logSystemNote("Đề xuất tạm dừng công việc.") }); }
  function proposeCancel() { onUpdate({ status: "cancelled", comments: logSystemNote("Đề xuất hủy công việc.") }); }

  function submitExtend() {
    if (!extendDate) return;
    onUpdate({ deadline: extendDate, comments: logSystemNote(`Xin gia hạn deadline tới ${extendDate}.`) });
    setShowExtend(false);
    setExtendDate("");
  }

  function startEdit() {
    setEditForm({ title: task.title, description: task.description || "", deadline: task.deadline || "", priority: task.priority });
    setEditing(true);
  }

  function saveEdit() {
    onUpdate({
      title: editForm.title.trim() || task.title,
      description: editForm.description.trim(),
      deadline: editForm.deadline,
      priority: editForm.priority,
      comments: logSystemNote("Đề xuất sửa và cập nhật lại thông tin công việc."),
    });
    setEditing(false);
  }

  const actionBtn = (color) => ({
    display: "flex", alignItems: "center", gap: 5, background: "#fff", color, border: `1px solid ${color}`,
    borderRadius: 6, padding: "7px 12px", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
  });

  return (
    <div style={{ borderTop: `1px solid ${COLORS.border}`, marginTop: 12, paddingTop: 14 }} onClick={(e) => e.stopPropagation()}>
      {task.description && <p style={{ fontSize: 13, color: COLORS.muted, margin: "0 0 14px", whiteSpace: "pre-wrap" }}>{task.description}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 12 }}>
        <Field label="Người giao" value={task.assigner} />
        <Field label="Ngày giao" value={task.assignedDate} />
        <Field label="Tần suất" value={task.frequency || "Một lần"} />
        <Field label="Phối hợp" value={task.collaborators} />
      </div>

      <div style={{ marginBottom: 16, fontSize: 13 }}>
        <span style={{ color: COLORS.muted }}>Nguồn giao việc: </span>
        <span style={{ color: COLORS.ink, fontWeight: 600 }}>{task.source || "Giao việc mới"}</span>
      </div>

      {editing && (
        <div style={{ background: COLORS.surface, borderRadius: 8, padding: 12, marginBottom: 16 }}>
          <input placeholder="Tên công việc" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} style={{ ...inputStyle, marginBottom: 8 }} />
          <textarea placeholder="Nội dung" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={2} style={{ ...inputStyle, resize: "vertical", marginBottom: 8 }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto auto", gap: 8, alignItems: "end" }}>
            <div>
              <label style={{ display: "block", fontSize: 11, color: COLORS.muted, marginBottom: 3 }}>Deadline</label>
              <input type="date" value={editForm.deadline} onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })} style={inputStyle} />
            </div>
            <select value={editForm.priority} onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })} style={inputStyle}>
              {Object.entries(PRIORITIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <button onClick={saveEdit} style={{ background: COLORS.accentGrad, color: "#fff", border: "none", borderRadius: 6, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Lưu</button>
            <button onClick={() => setEditing(false)} style={{ background: "#fff", color: COLORS.muted, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "8px 14px", fontSize: 13, cursor: "pointer" }}>Hủy</button>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8 }}>
          Báo cáo kết quả theo từng ngày
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 10 }}>
          {updates.map((c) => (
            <div key={c.id} style={{ display: "flex", gap: 8 }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: hashColor(c.author), color: "#fff", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {initials(c.author)}
              </div>
              <div style={{ flex: 1, background: COLORS.surface, borderRadius: 8, padding: "6px 10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.ink }}>{c.author}</span>
                  <span style={{ fontSize: 11, color: COLORS.muted }}>{fmtDateTime(c.createdAt)}</span>
                </div>
                {c.text && <p style={{ fontSize: 13, color: COLORS.ink, margin: "2px 0 0", whiteSpace: "pre-wrap" }}>{c.text}</p>}
                {c.attachment && <UpdateAttachment att={c.attachment} />}
              </div>
            </div>
          ))}
          {updates.length === 0 && <span style={{ fontSize: 12, color: COLORS.muted }}>Chưa có cập nhật.</span>}
        </div>

        {canAct && (
          <>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <input
                placeholder="Nhập cập nhật tiến độ hôm nay…"
                value={updateText}
                onChange={(e) => setUpdateText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addUpdate()}
                style={{ ...inputStyle, flex: "1 1 220px" }}
              />
              <input type="file" onChange={handleFile} disabled={busy} style={{ fontSize: 12, maxWidth: 200 }} />
              <button onClick={addUpdate} style={{ background: COLORS.ink, color: "#fff", border: "none", borderRadius: 6, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Thêm
              </button>
            </div>
            {pendingFile && (
              <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 6 }}>Đính kèm: {pendingFile.name} ({formatBytes(pendingFile.size)})</div>
            )}
            <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 6 }}>
              File đính kèm tối đa {formatBytes(MAX_ATTACHMENT_BYTES)} (giới hạn bởi dung lượng lưu trữ trình duyệt).
            </div>
            {fileError && <div style={{ color: COLORS.danger, fontSize: 12, marginTop: 4 }}>{fileError}</div>}
          </>
        )}
      </div>

      {canAct && !editing && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button onClick={markDone} style={actionBtn("#1F6B4A")}><CheckCircle2 size={13} /> Đánh dấu hoàn thành</button>
          <button onClick={() => setShowExtend((s) => !s)} style={actionBtn("#1D5FA8")}><RotateCcw size={13} /> Xin gia hạn</button>
          <button onClick={markNotDone} style={actionBtn(COLORS.danger)}><XCircle size={13} /> Đánh dấu không hoàn thành</button>
          <button onClick={proposePause} style={actionBtn("#6B5B73")}><PauseCircle size={13} /> Đề xuất tạm dừng</button>
          <button onClick={proposeCancel} style={actionBtn(COLORS.danger)}><Ban size={13} /> Đề xuất hủy</button>
          <button onClick={startEdit} style={actionBtn(COLORS.purple)}><Pencil size={13} /> Đề xuất sửa</button>
        </div>
      )}

      {showExtend && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10 }}>
          <input type="date" value={extendDate} onChange={(e) => setExtendDate(e.target.value)} style={{ ...inputStyle, width: "auto" }} />
          <button onClick={submitExtend} style={{ background: COLORS.accentGrad, color: "#fff", border: "none", borderRadius: 6, padding: "7px 12px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
            Xác nhận gia hạn
          </button>
        </div>
      )}
    </div>
  );
}
