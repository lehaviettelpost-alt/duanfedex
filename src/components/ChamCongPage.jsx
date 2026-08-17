import React, { useMemo, useState } from "react";
import { COLORS, hashColor, initials, cardStyle } from "../theme";
import { ATTENDANCE_CODES, ATTENDANCE_CODE_MAP, DUTY_CODES, daysInMonth, pad2, isoDate, LEGEND_TEXT } from "../attendanceShared";

const TABS = [
  { key: "grid", label: "1. Bảng chấm công" },
  { key: "monthly", label: "2. Điểm chuyên cần tháng" },
  { key: "yearly", label: "3. Điểm chuyên cần năm" },
  { key: "duty", label: "4. Lịch trực" },
];

function todayYearMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

function AttendanceCell({ code, editable, onChange }) {
  const info = code ? ATTENDANCE_CODE_MAP[code] : null;
  if (!editable) {
    return (
      <div style={{
        height: 26, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 10.5, fontWeight: 600, color: info ? info.fg : COLORS.muted, background: info ? info.bg : "transparent", borderRadius: 4,
      }}>
        {code || ""}
      </div>
    );
  }
  return (
    <select
      value={code || ""}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%", height: 26, border: "none", borderRadius: 4, textAlign: "center", textAlignLast: "center",
        fontSize: 10.5, fontWeight: 600, cursor: "pointer",
        color: info ? info.fg : COLORS.muted, background: info ? info.bg : COLORS.surface,
      }}
    >
      <option value="">—</option>
      {ATTENDANCE_CODES.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
    </select>
  );
}

function AttendanceGrid({ users, days, yearNum, monthNum, recordMap, editable, onSetCode, filterCodes }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ minWidth: 180 + days.length * 40 }}>
        <div style={{ display: "grid", gridTemplateColumns: `180px repeat(${days.length}, 40px)`, gap: 2 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.4, padding: "4px 6px" }}>
            Nhân sự
          </div>
          {days.map((d) => (
            <div key={d} style={{ fontSize: 10.5, fontWeight: 700, color: COLORS.muted, textAlign: "center", padding: "4px 2px" }}>
              {pad2(d)}
            </div>
          ))}

          {users.map((u) => (
            <React.Fragment key={u.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 6px", minWidth: 0, borderTop: `1px solid ${COLORS.border}` }}>
                <div style={{
                  width: 18, height: 18, borderRadius: "50%", background: hashColor(u.name),
                  color: "#fff", fontSize: 8, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  {initials(u.name)}
                </div>
                <span style={{ fontSize: 12, color: COLORS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</span>
              </div>
              {days.map((d) => {
                const date = isoDate(yearNum, monthNum, d);
                const rec = recordMap[`${u.name}|${date}`];
                const code = rec?.code || "";
                if (filterCodes && !filterCodes.includes(code)) {
                  return <div key={d} style={{ borderTop: `1px solid ${COLORS.border}` }} />;
                }
                return (
                  <div key={d} style={{ borderTop: `1px solid ${COLORS.border}`, padding: "2px 1px" }}>
                    <AttendanceCell code={code} editable={editable} onChange={(v) => onSetCode(u.name, date, v)} />
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

function computeSummary(records, users, matches) {
  return users.map((u) => {
    const own = records.filter((r) => r.employee === u.name && matches(r.date));
    const counts = {};
    ATTENDANCE_CODES.forEach((c) => { counts[c.code] = 0; });
    own.forEach((r) => { if (counts[r.code] !== undefined) counts[r.code]++; });
    const full = counts.L8;
    const leave = counts.N + counts.N4 + counts.L + counts.HH;
    const late = counts.N1 + counts.N2 + counts.M;
    const absent = counts.V;
    const duty = counts.T + counts.TT7 + counts.TCN;
    const denom = full + late + absent;
    const rate = denom > 0 ? Math.round((full / denom) * 100) : null;
    return { user: u, full, leave, late, absent, duty, rate };
  });
}

function DiligenceTable({ records, users, matches, emptyNote }) {
  const rows = useMemo(() => computeSummary(records, users, matches), [records, users, matches]);
  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ minWidth: 720 }}>
        <div style={{
          display: "grid", gridTemplateColumns: "1.6fr 0.8fr 0.9fr 1fr 0.8fr 0.8fr 1fr",
          gap: 10, padding: "0 10px 8px", fontSize: 11, fontWeight: 600, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.4,
        }}>
          <span>Nhân sự</span><span>Làm đủ</span><span>Nghỉ phép</span><span>Muộn/sớm</span><span>Vắng</span><span>Trực</span><span>Tỷ lệ chuyên cần</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {rows.map(({ user, full, leave, late, absent, duty, rate }) => (
            <div key={user.id} style={{ display: "grid", gridTemplateColumns: "1.6fr 0.8fr 0.9fr 1fr 0.8fr 0.8fr 1fr", gap: 10, alignItems: "center", background: COLORS.surface, borderRadius: 8, padding: "8px 10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: "50%", background: hashColor(user.name),
                  color: "#fff", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  {initials(user.name)}
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</span>
              </div>
              <span className="tb-mono" style={{ fontSize: 12, color: COLORS.ink }}>{full}</span>
              <span className="tb-mono" style={{ fontSize: 12, color: COLORS.muted }}>{leave}</span>
              <span className="tb-mono" style={{ fontSize: 12, color: "#8A5A00" }}>{late}</span>
              <span className="tb-mono" style={{ fontSize: 12, color: COLORS.danger }}>{absent}</span>
              <span className="tb-mono" style={{ fontSize: 12, color: "#5B2C6F" }}>{duty}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: rate === null ? COLORS.muted : rate >= 90 ? "#1F6B4A" : rate >= 70 ? "#8A5A00" : COLORS.danger }}>
                {rate === null ? "—" : `${rate}%`}
              </span>
            </div>
          ))}
          {users.length === 0 && <div style={{ fontSize: 13, color: COLORS.muted, textAlign: "center", padding: "16px 0" }}>{emptyNote}</div>}
        </div>
      </div>
    </div>
  );
}

export default function ChamCongPage({ records, users, canManage, onPersist }) {
  const [tab, setTab] = useState("grid");
  const [yearMonth, setYearMonth] = useState(todayYearMonth());
  const [year, setYear] = useState(String(new Date().getFullYear()));

  const [ymYear, ymMonth] = yearMonth.split("-").map(Number);
  const numDays = daysInMonth(ymYear, ymMonth);
  const days = useMemo(() => Array.from({ length: numDays }, (_, i) => i + 1), [numDays]);

  const recordMap = useMemo(() => {
    const m = {};
    records.forEach((r) => { m[`${r.employee}|${r.date}`] = r; });
    return m;
  }, [records]);

  function setCode(employee, date, code) {
    if (!canManage) return;
    const key = `${employee}|${date}`;
    const existing = recordMap[key];
    if (!code) {
      if (existing) onPersist(records.filter((r) => r.id !== existing.id));
      return;
    }
    if (existing) {
      onPersist(records.map((r) => (r.id === existing.id ? { ...r, code } : r)));
    } else {
      onPersist([...records, { id: "att_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7), employee, date, code }]);
    }
  }

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <h1 className="tb-title" style={{ fontSize: 26, fontWeight: 700, color: COLORS.ink, margin: 0 }}>Chấm công</h1>
        <p style={{ color: COLORS.muted, fontSize: 14, margin: "4px 0 0" }}>Bảng chấm công — Sub-admin & Admin thao tác</p>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {TABS.map((t) => {
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

      {(tab === "grid" || tab === "duty") && (
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
            <input
              type="month"
              value={yearMonth}
              onChange={(e) => setYearMonth(e.target.value)}
              style={{ padding: "8px 10px", border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 13 }}
            />
            <span style={{ fontSize: 12.5, color: COLORS.muted }}>
              {tab === "grid" ? (canManage ? "Bấm vào ô để chọn mã trạng thái chấm công." : "Chỉ Admin/Sub-admin mới chỉnh sửa được.") : "Chỉ hiển thị các ngày trực (T, TT7, TCN)."}
            </span>
          </div>

          <AttendanceGrid
            users={users} days={days} yearNum={ymYear} monthNum={ymMonth}
            recordMap={recordMap} editable={tab === "grid" && canManage} onSetCode={setCode}
            filterCodes={tab === "duty" ? DUTY_CODES : null}
          />

          {tab === "grid" && (
            <p style={{ fontSize: 11, color: COLORS.muted, marginTop: 14, marginBottom: 0, lineHeight: 1.7 }}>{LEGEND_TEXT}</p>
          )}
        </div>
      )}

      {tab === "monthly" && (
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
            <input
              type="month"
              value={yearMonth}
              onChange={(e) => setYearMonth(e.target.value)}
              style={{ padding: "8px 10px", border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 13 }}
            />
            <span style={{ fontSize: 12.5, color: COLORS.muted }}>
              Tỷ lệ chuyên cần = Làm đủ / (Làm đủ + Muộn/sớm + Vắng) trong tháng đã chọn.
            </span>
          </div>
          <DiligenceTable records={records} users={users} matches={(date) => date.startsWith(yearMonth)} emptyNote="Chưa có nhân sự." />
        </div>
      )}

      {tab === "yearly" && (
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
            <input
              type="number" value={year} onChange={(e) => setYear(e.target.value)}
              style={{ padding: "8px 10px", border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 13, width: 100 }}
            />
            <span style={{ fontSize: 12.5, color: COLORS.muted }}>
              Tỷ lệ chuyên cần = Làm đủ / (Làm đủ + Muộn/sớm + Vắng) trong cả năm đã chọn.
            </span>
          </div>
          <DiligenceTable records={records} users={users} matches={(date) => date.startsWith(String(year))} emptyNote="Chưa có nhân sự." />
        </div>
      )}
    </>
  );
}
