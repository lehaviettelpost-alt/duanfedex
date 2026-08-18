import React, { useState } from "react";
import { Paperclip, X, Trash2, Download } from "lucide-react";
import {
  COLORS, hashColor, initials, inputStyle, cardStyle,
  todayIsoDate, formatBytes, readFileAsDataUrl, MAX_ATTACHMENT_BYTES,
} from "../theme";

const FREQ_OPTIONS = ["Một lần", "Hàng ngày", "Hàng tuần", "Hàng tháng", "Hàng quý"];

const EMPTY_MEETING = { date: todayIsoDate(), topic: "", chair: "", attendees: "", proceedings: "", conclusion: "", attachment: null };

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

function MeetingDetailModal({ meeting, onClose, onEdit, canManage }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(43,20,32,0.45)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 16px", zIndex: 50, overflowY: "auto" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, maxWidth: 720, width: "100%", padding: 24, marginBottom: 40 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 4 }}>
          <div>
            <span className="tb-mono" style={{ fontSize: 11, color: COLORS.muted }}>{meeting.date}</span>
            <h2 className="tb-title" style={{ fontSize: 18, fontWeight: 700, color: COLORS.ink, margin: "2px 0 0" }}>{meeting.topic}</h2>
          </div>
          <X size={18} style={{ cursor: "pointer", color: COLORS.muted, flexShrink: 0 }} onClick={onClose} />
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, margin: "10px 0 16px", fontSize: 12.5, color: COLORS.muted }}>
          <span>Chủ trì: <strong style={{ color: COLORS.ink }}>{meeting.chair || "—"}</strong></span>
          <span>Thành phần: <strong style={{ color: COLORS.ink }}>{meeting.attendees || "—"}</strong></span>
        </div>

        {meeting.proceedings && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 }}>Diễn biến cuộc họp</div>
            <p style={{ fontSize: 13.5, color: COLORS.ink, lineHeight: 1.6, whiteSpace: "pre-wrap", margin: 0 }}>{meeting.proceedings}</p>
          </div>
        )}

        {meeting.conclusion && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 }}>Kết luận cuộc họp</div>
            <p style={{ fontSize: 13.5, color: COLORS.ink, lineHeight: 1.6, whiteSpace: "pre-wrap", margin: 0 }}>{meeting.conclusion}</p>
          </div>
        )}

        {meeting.attachment && (
          <a href={meeting.attachment.dataUrl} download={meeting.attachment.name} style={{ display: "flex", alignItems: "center", gap: 6, color: COLORS.purple, fontSize: 13, textDecoration: "none", marginBottom: 16 }}>
            <Download size={13} /> {meeting.attachment.name} ({formatBytes(meeting.attachment.size)})
          </a>
        )}

        <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8 }}>
          Việc đã giao từ cuộc họp ({(meeting.tasks || []).length})
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
          {(meeting.tasks || []).map((t) => (
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
          {(!meeting.tasks || meeting.tasks.length === 0) && <span style={{ fontSize: 12, color: COLORS.muted }}>Chưa giao việc nào từ cuộc họp này.</span>}
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

export default function SoGiaoBanPage({ records, users, canManage, onPersist }) {
  const [tab, setTab] = useState(() => (canManage ? "form" : "list"));
  const [form, setForm] = useState(EMPTY_MEETING);
  const [activeId, setActiveId] = useState(null);
  const [taskRows, setTaskRows] = useState([]);
  const [formError, setFormError] = useState("");
  const [taskError, setTaskError] = useState("");
  const [attachError, setAttachError] = useState("");
  const [viewingId, setViewingId] = useState(null);

  function startNewMeeting() {
    setForm(EMPTY_MEETING);
    setActiveId(null);
    setTaskRows([]);
    setFormError("");
    setTaskError("");
  }

  function saveMeeting() {
    if (!form.topic.trim()) {
      setFormError("Nhập chủ đề cuộc họp trước đã.");
      return;
    }
    if (activeId) {
      onPersist(records.map((r) => (r.id === activeId ? { ...r, ...form } : r)));
    } else {
      const newMeeting = { id: "gb_" + Date.now(), ...form, tasks: [] };
      onPersist([newMeeting, ...records]);
      setActiveId(newMeeting.id);
    }
    setFormError("");
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
      setForm({ ...form, attachment: { name: file.name, size: file.size, dataUrl } });
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
    if (!activeId) {
      setTaskError("Lưu sổ giao ban trước khi giao việc.");
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
    onPersist(records.map((r) => (r.id === activeId ? { ...r, tasks: [...(r.tasks || []), ...taskRows] } : r)));
    setTaskRows([]);
    setTaskError("");
  }

  function removeMeeting(id) {
    onPersist(records.filter((r) => r.id !== id));
    if (activeId === id) startNewMeeting();
    if (viewingId === id) setViewingId(null);
  }

  function editMeeting(meeting) {
    setForm({ date: meeting.date, topic: meeting.topic, chair: meeting.chair, attendees: meeting.attendees, proceedings: meeting.proceedings, conclusion: meeting.conclusion, attachment: meeting.attachment || null });
    setActiveId(meeting.id);
    setTaskRows([]);
    setViewingId(null);
    setTab("form");
  }

  const viewingMeeting = records.find((r) => r.id === viewingId) || null;

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <h1 className="tb-title" style={{ fontSize: 26, fontWeight: 700, color: COLORS.ink, margin: 0 }}>Sổ giao ban</h1>
        <p style={{ color: COLORS.muted, fontSize: 14, margin: "4px 0 0" }}>Ghi nhận nội dung giao ban và nhiệm vụ được giao</p>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          ...(canManage ? [{ key: "form", label: "Sổ giao ban" }] : []),
          { key: "list", label: `Danh sách cuộc họp (${records.length})` },
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
          {activeId && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, background: COLORS.surface, borderRadius: 8, padding: "8px 12px" }}>
              <span style={{ fontSize: 12.5, color: COLORS.ink }}>Đang chỉnh sửa sổ giao ban đã lưu.</span>
              <button onClick={startNewMeeting} style={{ background: "none", border: "none", color: COLORS.purple, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                + Tạo cuộc họp mới
              </button>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>Ngày</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>Chủ đề cuộc họp</label>
              <input placeholder="VD: Giao ban tuần 32" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} style={inputStyle} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>Chủ trì</label>
              <input placeholder="VD: Mr Dũng - TP" value={form.chair} onChange={(e) => setForm({ ...form, chair: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>Thành phần tham gia</label>
              <input placeholder="VD: Anh A, Chị B, Anh C..." value={form.attendees} onChange={(e) => setForm({ ...form, attendees: e.target.value })} style={inputStyle} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>Diễn biến cuộc họp</label>
              <textarea
                placeholder="Ghi diễn biến cuộc họp như một trang sổ tay..."
                value={form.proceedings}
                onChange={(e) => setForm({ ...form, proceedings: e.target.value })}
                rows={7}
                style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>Kết luận cuộc họp</label>
              <textarea
                placeholder="Ghi kết luận / chỉ đạo của cuộc họp..."
                value={form.conclusion}
                onChange={(e) => setForm({ ...form, conclusion: e.target.value })}
                rows={7}
                style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <button onClick={saveMeeting} style={{ background: COLORS.accentGrad, color: "#fff", border: "none", borderRadius: 6, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Lưu sổ giao ban
            </button>
            <label style={{ display: "flex", alignItems: "center", gap: 6, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "9px 14px", fontSize: 13, color: COLORS.ink, cursor: "pointer" }}>
              <Paperclip size={14} /> {form.attachment ? form.attachment.name : "Đính kèm file"}
              <input type="file" onChange={handleAttach} style={{ display: "none" }} />
            </label>
            {form.attachment && (
              <X size={14} style={{ cursor: "pointer", color: COLORS.muted }} onClick={() => setForm({ ...form, attachment: null })} />
            )}
          </div>
          {formError && <div style={{ color: COLORS.danger, fontSize: 13, marginTop: 6 }}>{formError}</div>}
          {attachError && <div style={{ color: COLORS.danger, fontSize: 13, marginTop: 6 }}>{attachError}</div>}

          <div style={{ marginTop: 22, paddingTop: 18, borderTop: `1px solid ${COLORS.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 10 }}>
              Giao việc từ nội dung cuộc họp
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
              display: "grid", gridTemplateColumns: "0.9fr 2fr 1.2fr 0.9fr auto",
              gap: 12, padding: "0 12px 8px", fontSize: 11, fontWeight: 600, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.4,
            }}>
              <span>Ngày</span><span>Chủ đề</span><span>Chủ trì</span><span>Việc giao</span><span />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {records.map((meeting) => (
                <div
                  key={meeting.id}
                  className="tb-card"
                  style={{
                    display: "grid", gridTemplateColumns: "0.9fr 2fr 1.2fr 0.9fr auto", gap: 12, alignItems: "center",
                    background: "#fff", borderRadius: 8, border: `1px solid ${COLORS.border}`, borderLeft: `4px solid ${COLORS.purple}`,
                    padding: "10px 12px", transition: "all 0.15s",
                  }}
                >
                  <span className="tb-mono" style={{ fontSize: 12, color: COLORS.muted }}>{meeting.date}</span>
                  <button onClick={() => setViewingId(meeting.id)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", fontSize: 13, fontWeight: 500, color: COLORS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {meeting.topic}
                  </button>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                    {meeting.chair && (
                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: hashColor(meeting.chair), color: "#fff", fontSize: 8, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {initials(meeting.chair)}
                      </div>
                    )}
                    <span style={{ fontSize: 12, color: COLORS.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{meeting.chair || "—"}</span>
                  </div>
                  <span style={{ fontSize: 12, color: COLORS.muted }}>{(meeting.tasks || []).length} việc</span>
                  {canManage ? (
                    <Trash2 size={14} style={{ cursor: "pointer", color: "#B08A9A", justifySelf: "end" }} onClick={() => removeMeeting(meeting.id)} />
                  ) : <span />}
                </div>
              ))}
              {records.length === 0 && (
                <div style={{ fontSize: 13, color: COLORS.muted, textAlign: "center", padding: "24px 0", background: COLORS.surface, borderRadius: 8 }}>
                  Chưa có cuộc họp nào.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {viewingMeeting && (
        <MeetingDetailModal meeting={viewingMeeting} onClose={() => setViewingId(null)} onEdit={() => editMeeting(viewingMeeting)} canManage={canManage} />
      )}
    </>
  );
}
