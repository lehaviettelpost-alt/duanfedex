import React from "react";
import { LayoutGrid, ClipboardList, Users, CalendarDays } from "lucide-react";
import { COLORS } from "../theme";
import { GENERIC_MODULES, GENERIC_MODULE_ORDER } from "../modules";
import { FedExMark, ViettelPostMark } from "./BrandLogos";

const NAV_ITEMS = [
  { key: "overview", label: "Tổng quan", icon: LayoutGrid },
  { key: "giaoban", label: GENERIC_MODULES.giaoban.label, icon: GENERIC_MODULES.giaoban.icon },
  { key: "vanban", label: GENERIC_MODULES.vanban.label, icon: GENERIC_MODULES.vanban.icon },
  { key: "tasks", label: "Công việc", icon: ClipboardList },
  { key: "chamdiem", label: GENERIC_MODULES.chamdiem.label, icon: GENERIC_MODULES.chamdiem.icon },
  { key: "personnel", label: "Nhân sự", icon: Users },
  { key: "chamcong", label: GENERIC_MODULES.chamcong.label, icon: GENERIC_MODULES.chamcong.icon },
  { key: "link", label: GENERIC_MODULES.link.label, icon: GENERIC_MODULES.link.icon },
  { key: "baocao", label: GENERIC_MODULES.baocao.label, icon: GENERIC_MODULES.baocao.icon },
  { key: "feedback", label: GENERIC_MODULES.feedback.label, icon: GENERIC_MODULES.feedback.icon },
  { key: "calendar", label: "Calendar", icon: CalendarDays },
];

// sanity: mọi module chung phải nằm trong NAV_ITEMS
GENERIC_MODULE_ORDER.forEach((key) => {
  if (!NAV_ITEMS.some((item) => item.key === key)) {
    NAV_ITEMS.push({ key, label: GENERIC_MODULES[key].label, icon: GENERIC_MODULES[key].icon });
  }
});

export default function Sidebar({ active, onNavigate }) {
  return (
    <nav className="tb-sidebar" style={{ background: COLORS.sidebarBg, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "18px 14px 14px" }}>
        <FedExMark height={30} />
        <ViettelPostMark height={22} />
      </div>
      <div className="tb-sidebar-list" style={{ display: "flex", flexDirection: "column", gap: 2, padding: "6px 10px 16px" }}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              style={{
                display: "flex", alignItems: "center", gap: 10, textAlign: "left",
                background: isActive ? COLORS.accentGrad : "transparent",
                color: isActive ? "#fff" : COLORS.sidebarText,
                border: "none", borderRadius: 8, padding: "9px 12px", fontSize: 13.5, fontWeight: isActive ? 600 : 500,
                cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
              }}
            >
              <Icon size={16} style={{ flexShrink: 0 }} />
              {item.label}
            </button>
          );
        })}
      </div>
      <div style={{ flex: 1, minHeight: 120, padding: "0 14px 18px", display: "flex" }}>
        <img
          src="/viettelpost-banner.jpg"
          alt="Viettel Post - Cùng hàng Việt tiến bước toàn cầu"
          style={{ display: "block", width: "100%", height: "100%", objectFit: "cover", borderRadius: 10 }}
        />
      </div>
    </nav>
  );
}
