export const COLORS = {
  ink: "#2B1420",
  muted: "#8A6B78",
  surface: "#F6ECF1",
  card: "#FFFFFF",
  border: "#E4D1DE",
  purple: "#7A2048",
  red: "#A32638",
  danger: "#C0392B",
  accentGrad: "linear-gradient(135deg, #7A2048 0%, #A32638 100%)",
  sidebarBg: "#7A1224",
  sidebarItem: "#8F2434",
  sidebarText: "#F5D9DC",
  sidebarMuted: "#D9A3AA",
};

export const STATUSES = [
  { key: "todo", label: "Chưa bắt đầu" },
  { key: "doing", label: "Đang thực hiện" },
  { key: "paused", label: "Tạm dừng" },
  { key: "review", label: "Chờ phê duyệt" },
  { key: "done", label: "Hoàn thành" },
  { key: "cancelled", label: "Đã hủy" },
];

export const PRIORITIES = {
  high: { label: "Cao", fg: "#7A1224", bg: "#F3CFD6" },
  medium: { label: "Trung bình", fg: "#6B3F14", bg: "#F3E1C4" },
  low: { label: "Thấp", fg: "#4A2159", bg: "#E6D6EE" },
};

export const AVATAR_COLORS = ["#7A2048", "#A32638", "#5B2C6F", "#8B3A62", "#6A1B4D", "#B23A48"];

export const DASHBOARD_TILES = {
  total: { label: "Tổng công việc", fg: "#2B1420", bg: "#F0E1E8" },
  doing: { label: "Đang làm", fg: "#1D5FA8", bg: "#D7E6F5" },
  done: { label: "Đã hoàn thành", fg: "#1F6B4A", bg: "#D3EFDE" },
  overdue: { label: "Chậm tiến độ", fg: "#C0392B", bg: "#F6D7D2" },
};

export const STATUS_BAR_COLORS = { todo: "#B08A9A", doing: "#1D5FA8", paused: "#6B5B73", review: "#6B3F14", done: "#1F6B4A", cancelled: "#9C5A5A" };

export const DEADLINE_HEALTH = {
  overdue: { label: "Quá hạn", fg: "#C0392B", bg: "#F6D7D2" },
  due: { label: "Đến hạn", fg: "#8A5A00", bg: "#FCE8B8" },
  ontrack: { label: "Còn hạn", fg: "#1F6B4A", bg: "#D3EFDE" },
};

export const ROLES = {
  admin: { label: "Quản trị viên", fg: "#7A1224", bg: "#F3CFD6" },
  subadmin: { label: "Quản trị phụ", fg: "#6B3F14", bg: "#F3E1C4" },
  member: { label: "Thành viên", fg: "#4A2159", bg: "#E6D6EE" },
};

export function hashColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

export function initials(name) {
  const parts = (name || "").trim().split(/\s+/);
  const s = parts.length > 1 ? parts[parts.length - 2][0] + parts[parts.length - 1][0] : (name || "").slice(0, 2);
  return s.toUpperCase();
}

// null khi việc đã xong/tạm dừng/hủy hoặc chưa có ngày kết thúc — chỉ có ý nghĩa với việc đang hoạt động.
export function getDeadlineHealth(deadline, status) {
  if (!deadline || status === "done" || status === "paused" || status === "cancelled") return null;
  const today = new Date(new Date().toDateString());
  const due = new Date(deadline);
  if (due.getTime() < today.getTime()) return "overdue";
  if (due.getTime() === today.getTime()) return "due";
  return "ontrack";
}

export function isOverdue(deadline, status) {
  return getDeadlineHealth(deadline, status) === "overdue";
}

export function todayIsoDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Mã việc ổn định, tăng dần, không đổi khi xóa việc khác — vd CV0001, CV0002...
export function nextTaskCode(tasks) {
  let max = 0;
  tasks.forEach((t) => {
    const m = /^CV(\d+)$/.exec(t.code || "");
    if (m) max = Math.max(max, parseInt(m[1], 10));
  });
  return "CV" + String(max + 1).padStart(4, "0");
}

export function monthLabel(isoMonth) {
  const [y, m] = isoMonth.split("-");
  return `Tháng ${Number(m)}/${y}`;
}

export function timeGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return "Chào buổi sáng";
  if (h >= 11 && h < 13) return "Chào buổi trưa";
  if (h >= 13 && h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

export function isValidGmail(email) {
  return /^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(email.trim());
}

export function nameFromEmail(email) {
  const local = email.split("@")[0];
  return local.split(/[._]+/).filter(Boolean).map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
}

export const inputStyle = { padding: "8px 10px", border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 14, width: "100%" };
export const cardStyle = { background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 16, marginBottom: 20 };

export const MAX_ATTACHMENT_BYTES = 1.5 * 1024 * 1024; // localStorage quota is small — cap per file

export function formatBytes(bytes) {
  if (!bytes) return "0 KB";
  const kb = bytes / 1024;
  return kb < 1024 ? `${kb.toFixed(0)} KB` : `${(kb / 1024).toFixed(1)} MB`;
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Không đọc được file."));
    reader.readAsDataURL(file);
  });
}

export function fmtDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
