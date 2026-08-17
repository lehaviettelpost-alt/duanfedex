import React, { useMemo } from "react";
import { ClipboardList, Clock, CheckCircle2, AlertTriangle, Users } from "lucide-react";
import { COLORS, STATUSES, DASHBOARD_TILES, STATUS_BAR_COLORS, isOverdue, timeGreeting, todayIsoDate, cardStyle } from "../theme";
import { GENERIC_MODULES, GENERIC_MODULE_ORDER } from "../modules";
import { STATUS_OPTIONS as FEEDBACK_STATUS_OPTIONS, STATUS_COLORS as FEEDBACK_STATUS_COLORS } from "../feedbackShared";

const DONUT_RADIUS = 28;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

function FeedbackDonut({ records, onNavigate }) {
  const total = records.length;
  const counts = FEEDBACK_STATUS_OPTIONS.reduce((acc, s) => {
    acc[s] = records.filter((r) => r.status === s).length;
    return acc;
  }, {});

  let cumulative = 0;
  const segments = FEEDBACK_STATUS_OPTIONS.map((s) => {
    const fraction = total > 0 ? counts[s] / total : 0;
    const dash = fraction * DONUT_CIRCUMFERENCE;
    const seg = { status: s, count: counts[s], dash, offset: -cumulative };
    cumulative += dash;
    return seg;
  });

  return (
    <button
      onClick={() => onNavigate("feedback")}
      style={{
        gridColumn: "span 2", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 16,
        border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "12px 16px", background: "#fff",
      }}
    >
      <svg width="70" height="70" viewBox="0 0 70 70" style={{ flexShrink: 0, transform: "rotate(-90deg)" }}>
        <circle cx="35" cy="35" r={DONUT_RADIUS} fill="none" stroke={COLORS.border} strokeWidth="10" />
        {segments.map((seg) => seg.count > 0 && (
          <circle
            key={seg.status} cx="35" cy="35" r={DONUT_RADIUS} fill="none"
            stroke={(FEEDBACK_STATUS_COLORS[seg.status] || {}).fg || COLORS.muted} strokeWidth="10"
            strokeDasharray={`${seg.dash} ${DONUT_CIRCUMFERENCE - seg.dash}`} strokeDashoffset={seg.offset}
          />
        ))}
      </svg>
      <div style={{ minWidth: 0 }}>
        <div className="tb-title" style={{ fontSize: 16, fontWeight: 700, color: COLORS.ink, marginBottom: 4 }}>
          Ý kiến phản hồi ({total})
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {FEEDBACK_STATUS_OPTIONS.map((s) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: COLORS.muted }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: (FEEDBACK_STATUS_COLORS[s] || {}).fg || COLORS.muted, flexShrink: 0 }} />
              {s} · {counts[s]}
            </div>
          ))}
        </div>
      </div>
    </button>
  );
}

export default function OverviewPage({ tasks, users, moduleRecords, currentUser, onNavigate }) {
  const stats = useMemo(() => {
    const total = tasks.length;
    const byStatus = STATUSES.reduce((acc, s) => {
      acc[s.key] = tasks.filter((t) => t.status === s.key).length;
      return acc;
    }, {});
    const overdue = tasks.filter((t) => isOverdue(t.deadline, t.status)).length;
    return { total, byStatus, done: byStatus.done, doing: byStatus.doing, overdue };
  }, [tasks]);

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <h1 className="tb-title" style={{ fontSize: 26, fontWeight: 700, color: COLORS.ink, margin: 0 }}>Tổng quan</h1>
        <p style={{ color: COLORS.muted, fontSize: 14, margin: "4px 0 0" }}>
          {timeGreeting()}{currentUser ? `, ${currentUser.name}` : ""}! Chúc bạn một ngày tốt lành.
        </p>
      </div>

      <div style={cardStyle}>
        <span style={{ fontWeight: 600, fontSize: 14, color: COLORS.ink, display: "block", marginBottom: 12 }}>Tiến độ công việc</span>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 16 }}>
          {[
            { key: "total", value: stats.total, icon: ClipboardList },
            { key: "doing", value: stats.doing, icon: Clock },
            { key: "done", value: stats.done, icon: CheckCircle2 },
            { key: "overdue", value: stats.overdue, icon: AlertTriangle },
          ].map(({ key, value, icon: Icon }) => {
            const c = DASHBOARD_TILES[key];
            return (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 10, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: c.bg, color: c.fg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={17} />
                </div>
                <div>
                  <div className="tb-title" style={{ fontSize: 20, fontWeight: 700, color: c.fg }}>{value}</div>
                  <div style={{ fontSize: 12, color: COLORS.muted }}>{c.label}</div>
                </div>
              </div>
            );
          })}
        </div>
        {stats.total > 0 && (
          <>
            <div style={{ display: "flex", width: "100%", height: 10, borderRadius: 6, overflow: "hidden" }}>
              {STATUSES.map((s) => {
                const count = stats.byStatus[s.key];
                if (!count) return null;
                return <div key={s.key} title={`${s.label}: ${count}`} style={{ width: `${(count / stats.total) * 100}%`, background: STATUS_BAR_COLORS[s.key] }} />;
              })}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 10 }}>
              {STATUSES.map((s) => (
                <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_BAR_COLORS[s.key] }} />
                  <span style={{ fontSize: 12, color: COLORS.muted }}>{s.label} · {stats.byStatus[s.key]}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div style={cardStyle}>
        <span style={{ fontWeight: 600, fontSize: 14, color: COLORS.ink, display: "block", marginBottom: 12 }}>Các module khác</span>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
          <button
            onClick={() => onNavigate("personnel")}
            style={{ textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "12px 14px", background: "#fff" }}
          >
            <div style={{ width: 34, height: 34, borderRadius: 9, background: COLORS.surface, color: COLORS.purple, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Users size={17} />
            </div>
            <div>
              <div className="tb-title" style={{ fontSize: 20, fontWeight: 700, color: COLORS.ink }}>{users.length}</div>
              <div style={{ fontSize: 12, color: COLORS.muted }}>Nhân sự</div>
            </div>
          </button>
          {GENERIC_MODULE_ORDER.map((key) => {
            const config = GENERIC_MODULES[key];
            const Icon = config.icon;
            const allRecords = moduleRecords[key] || [];
            if (key === "feedback") {
              return <FeedbackDonut key={key} records={allRecords} onNavigate={onNavigate} />;
            }
            const isVanban = key === "vanban";
            const count = isVanban ? allRecords.filter((r) => r.date === todayIsoDate()).length : allRecords.length;
            return (
              <button
                key={key}
                onClick={() => onNavigate(key)}
                style={{ textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "12px 14px", background: "#fff" }}
              >
                <div style={{ width: 34, height: 34, borderRadius: 9, background: COLORS.surface, color: COLORS.purple, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={17} />
                </div>
                <div>
                  <div className="tb-title" style={{ fontSize: 20, fontWeight: 700, color: COLORS.ink }}>{count}</div>
                  <div style={{ fontSize: 12, color: COLORS.muted }}>{config.label}{isVanban ? " (hôm nay)" : ""}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
