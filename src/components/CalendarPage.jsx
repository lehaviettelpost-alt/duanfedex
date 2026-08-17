import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { COLORS, PRIORITIES, hashColor, initials, cardStyle } from "../theme";

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function toISODate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildMonthGrid(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7; // Monday = 0
  const gridStart = new Date(year, month, 1 - startOffset);
  const days = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push(d);
  }
  return days;
}

export default function CalendarPage({ tasks }) {
  const today = useMemo(() => new Date(), []);
  const [monthDate, setMonthDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(toISODate(today));

  const tasksByDate = useMemo(() => {
    const map = {};
    tasks.forEach((t) => {
      if (!t.deadline) return;
      (map[t.deadline] = map[t.deadline] || []).push(t);
    });
    return map;
  }, [tasks]);

  const days = useMemo(() => buildMonthGrid(monthDate), [monthDate]);
  const todayIso = toISODate(today);
  const selectedTasks = tasksByDate[selectedDate] || [];

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <h1 className="tb-title" style={{ fontSize: 26, fontWeight: 700, color: COLORS.ink, margin: 0 }}>Calendar</h1>
        <p style={{ color: COLORS.muted, fontSize: 14, margin: "4px 0 0" }}>Lịch hạn chót công việc</p>
      </div>

      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <button
            onClick={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1))}
            style={{ background: "none", border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: 6, cursor: "pointer", color: COLORS.ink }}
          >
            <ChevronLeft size={16} />
          </button>
          <span className="tb-title" style={{ fontWeight: 700, fontSize: 15, color: COLORS.ink }}>
            Tháng {monthDate.getMonth() + 1} / {monthDate.getFullYear()}
          </span>
          <button
            onClick={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1))}
            style={{ background: "none", border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: 6, cursor: "pointer", color: COLORS.ink }}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 6 }}>
          {WEEKDAYS.map((w) => (
            <div key={w} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: COLORS.muted, textTransform: "uppercase" }}>{w}</div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
          {days.map((d) => {
            const iso = toISODate(d);
            const inMonth = d.getMonth() === monthDate.getMonth();
            const dayTasks = tasksByDate[iso] || [];
            const isToday = iso === todayIso;
            const isSelected = iso === selectedDate;
            return (
              <button
                key={iso}
                onClick={() => setSelectedDate(iso)}
                style={{
                  textAlign: "left", cursor: "pointer", minHeight: 62, borderRadius: 8, padding: 6,
                  background: isSelected ? COLORS.accentGrad : "#fff",
                  border: `1px solid ${isSelected ? "transparent" : COLORS.border}`,
                  opacity: inMonth ? 1 : 0.4,
                }}
              >
                <div style={{
                  fontSize: 12, fontWeight: isToday ? 800 : 500,
                  color: isSelected ? "#fff" : (isToday ? COLORS.purple : COLORS.ink),
                }}>
                  {d.getDate()}
                </div>
                {dayTasks.length > 0 && (
                  <div style={{
                    marginTop: 4, fontSize: 10, fontWeight: 700, color: isSelected ? "#fff" : COLORS.purple,
                    background: isSelected ? "rgba(255,255,255,0.25)" : "#F3CFD6", borderRadius: 4, padding: "1px 5px", display: "inline-block",
                  }}>
                    {dayTasks.length} việc
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div style={cardStyle}>
        <span style={{ fontWeight: 600, fontSize: 14, color: COLORS.ink, display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
          <CalendarDays size={15} /> Công việc ngày {selectedDate.split("-").reverse().join("/")}
        </span>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {selectedTasks.map((t) => {
            const p = PRIORITIES[t.priority];
            return (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, background: COLORS.surface, borderRadius: 8, padding: "8px 10px", borderLeft: `4px solid ${p.fg}` }}>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%", background: hashColor(t.assignee),
                  color: "#fff", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  {initials(t.assignee)}
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, color: COLORS.ink, flex: 1 }}>{t.title}</span>
                <span style={{ fontSize: 12, color: COLORS.muted }}>{t.assignee}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: p.fg, background: p.bg, borderRadius: 4, padding: "2px 6px" }}>{p.label}</span>
              </div>
            );
          })}
          {selectedTasks.length === 0 && (
            <div style={{ fontSize: 13, color: COLORS.muted, textAlign: "center", padding: "16px 0" }}>Không có công việc đến hạn ngày này.</div>
          )}
        </div>
      </div>
    </>
  );
}
