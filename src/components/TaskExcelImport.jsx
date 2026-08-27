import React, { useState } from "react";
import { X, Download, Upload, CheckCircle2, AlertTriangle } from "lucide-react";
import { COLORS, PRIORITIES, todayIsoDate } from "../theme";

const HEADERS = ["Tên công việc", "Người phụ trách", "Mô tả", "Ưu tiên", "Ngày giao", "Deadline", "Người giao", "Tần suất", "Phối hợp"];

const PRIORITY_LOOKUP = Object.entries(PRIORITIES).reduce((acc, [key, v]) => {
  acc[v.label.toLowerCase()] = key;
  return acc;
}, {});

function parsePriority(value) {
  const s = String(value || "").trim().toLowerCase();
  return PRIORITY_LOOKUP[s] || "medium";
}

function toIsoDate(value) {
  if (!value) return "";
  if (value instanceof Date && !isNaN(value)) {
    const y = value.getFullYear(), m = String(value.getMonth() + 1).padStart(2, "0"), d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return "";
}

async function downloadTemplate() {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    HEADERS,
    ["Phân bổ chi phí tháng 8", "Nguyễn Văn A", "Rà soát và phân bổ chi phí phát sinh", "Cao", "20/08/2026", "31/08/2026", "GĐTT", "Một lần", ""],
  ]);
  ws["!cols"] = HEADERS.map(() => ({ wch: 22 }));
  XLSX.utils.book_append_sheet(wb, ws, "Giao việc");
  XLSX.writeFile(wb, "mau_giao_viec.xlsx");
}

function parseRows(rawRows, users, nextCodeStart) {
  let counter = nextCodeStart;
  const valid = [];
  const invalid = [];

  rawRows.forEach((row, idx) => {
    const title = String(row["Tên công việc"] || "").trim();
    const assigneeName = String(row["Người phụ trách"] || "").trim();
    const rowNo = idx + 2; // dòng thực tế trong Excel (dòng 1 là tiêu đề)

    if (!title || !assigneeName) {
      invalid.push({ rowNo, reason: "Thiếu tên công việc hoặc người phụ trách." });
      return;
    }
    const assigneeUser = users.find((u) => u.name.trim().toLowerCase() === assigneeName.toLowerCase());
    if (!assigneeUser) {
      invalid.push({ rowNo, reason: `Không tìm thấy nhân sự "${assigneeName}".` });
      return;
    }

    const code = "CV" + String(counter).padStart(4, "0");
    counter++;
    valid.push({
      id: "t" + Date.now() + "_" + rowNo,
      code,
      title,
      description: String(row["Mô tả"] || "").trim(),
      assignee: assigneeUser.name,
      priority: parsePriority(row["Ưu tiên"]),
      status: "todo",
      assignedDate: toIsoDate(row["Ngày giao"]) || todayIsoDate(),
      deadline: toIsoDate(row["Deadline"]),
      assigner: String(row["Người giao"] || "").trim(),
      frequency: String(row["Tần suất"] || "").trim() || "Một lần",
      collaborators: String(row["Phối hợp"] || "").trim(),
      source: "Giao việc bằng Excel",
      comments: [],
      attachments: [],
      result: null,
    });
  });

  return { valid, invalid };
}

export default function TaskExcelImport({ users, nextCodeStart, onImport, onClose }) {
  const [parsed, setParsed] = useState(null); // { valid, invalid }
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array", cellDates: true });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      if (rows.length === 0) {
        setError("File không có dữ liệu.");
        setParsed(null);
      } else {
        setFileName(file.name);
        setParsed(parseRows(rows, users, nextCodeStart));
      }
    } catch {
      setError("Không đọc được file này. Vui lòng dùng file .xlsx theo mẫu.");
      setParsed(null);
    } finally {
      setBusy(false);
    }
  }

  function confirmImport() {
    if (!parsed || parsed.valid.length === 0) return;
    onImport(parsed.valid);
    onClose();
  }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(43,20,32,0.45)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 16px", zIndex: 50, overflowY: "auto" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, maxWidth: 720, width: "100%", padding: 24, marginBottom: 40 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <h2 className="tb-title" style={{ fontSize: 18, fontWeight: 700, color: COLORS.ink, margin: 0 }}>Giao việc bằng Excel</h2>
          <X size={18} style={{ cursor: "pointer", color: COLORS.muted, flexShrink: 0 }} onClick={onClose} />
        </div>
        <p style={{ fontSize: 13, color: COLORS.muted, margin: "4px 0 18px" }}>
          Tải file mẫu, điền danh sách công việc rồi tải lên để giao việc hàng loạt.
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
          <button onClick={downloadTemplate} style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", color: COLORS.purple, border: `1px solid ${COLORS.purple}`, borderRadius: 6, padding: "9px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <Download size={14} /> Tải file mẫu (.xlsx)
          </button>
          <label style={{ display: "flex", alignItems: "center", gap: 6, background: COLORS.ink, color: "#fff", borderRadius: 6, padding: "9px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <Upload size={14} /> {fileName || "Chọn file Excel"}
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} disabled={busy} style={{ display: "none" }} />
          </label>
        </div>

        {error && <div style={{ color: COLORS.danger, fontSize: 13, marginBottom: 14 }}>{error}</div>}

        {parsed && (
          <>
            <div style={{ display: "flex", gap: 16, marginBottom: 12, fontSize: 13 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#1F6B4A", fontWeight: 600 }}>
                <CheckCircle2 size={14} /> {parsed.valid.length} dòng hợp lệ
              </span>
              {parsed.invalid.length > 0 && (
                <span style={{ display: "flex", alignItems: "center", gap: 5, color: COLORS.danger, fontWeight: 600 }}>
                  <AlertTriangle size={14} /> {parsed.invalid.length} dòng lỗi
                </span>
              )}
            </div>

            {parsed.valid.length > 0 && (
              <div style={{ overflowX: "auto", marginBottom: 14 }}>
                <div style={{ minWidth: 600 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 0.9fr 0.9fr 0.9fr", gap: 8, padding: "0 8px 6px", fontSize: 10.5, fontWeight: 700, color: COLORS.muted, textTransform: "uppercase" }}>
                    <span>Tên công việc</span><span>Người phụ trách</span><span>Ưu tiên</span><span>Ngày giao</span><span>Deadline</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 220, overflowY: "auto" }}>
                    {parsed.valid.map((t) => (
                      <div key={t.id} style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 0.9fr 0.9fr 0.9fr", gap: 8, background: COLORS.surface, borderRadius: 6, padding: "6px 8px", fontSize: 12.5 }}>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</span>
                        <span style={{ color: COLORS.muted }}>{t.assignee}</span>
                        <span style={{ color: COLORS.muted }}>{PRIORITIES[t.priority].label}</span>
                        <span className="tb-mono" style={{ color: COLORS.muted }}>{t.assignedDate}</span>
                        <span className="tb-mono" style={{ color: COLORS.muted }}>{t.deadline || "—"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {parsed.invalid.length > 0 && (
              <div style={{ background: "#FBEAEA", borderRadius: 8, padding: 10, marginBottom: 14 }}>
                {parsed.invalid.map((r, i) => (
                  <div key={i} style={{ fontSize: 12, color: COLORS.danger }}>Dòng {r.rowNo}: {r.reason}</div>
                ))}
              </div>
            )}

            <button
              onClick={confirmImport}
              disabled={parsed.valid.length === 0}
              style={{
                background: parsed.valid.length === 0 ? COLORS.border : COLORS.accentGrad, color: "#fff", border: "none",
                borderRadius: 6, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: parsed.valid.length === 0 ? "default" : "pointer",
              }}
            >
              Xác nhận giao {parsed.valid.length} công việc
            </button>
          </>
        )}
      </div>
    </div>
  );
}
