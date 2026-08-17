export const ATTENDANCE_CODES = [
  { code: "L8", label: "Làm cả ngày", fg: "#1F6B4A", bg: "#D3EFDE" },
  { code: "N", label: "Nghỉ cả ngày (đã duyệt)", fg: "#6B5B73", bg: "#E6DEE9" },
  { code: "N4", label: "Nghỉ nửa ngày", fg: "#8A5A00", bg: "#FCE8B8" },
  { code: "N1", label: "Xin đến muộn", fg: "#8A5A00", bg: "#FCE8B8" },
  { code: "N2", label: "Xin về sớm", fg: "#8A5A00", bg: "#FCE8B8" },
  { code: "M", label: "Đến muộn bị nhắc nhở", fg: "#C0392B", bg: "#F6D7D2" },
  { code: "V", label: "Vắng chưa được đồng ý", fg: "#fff", bg: "#C0392B" },
  { code: "L", label: "Nghỉ lễ", fg: "#1D5FA8", bg: "#D7E6F5" },
  { code: "T", label: "Trực lễ", fg: "#5B2C6F", bg: "#E6D6EE" },
  { code: "CN", label: "Nghỉ chủ nhật", fg: "#8A6B78", bg: "#F0E1E8" },
  { code: "T7", label: "Nghỉ thứ 7", fg: "#8A6B78", bg: "#F0E1E8" },
  { code: "TT7", label: "Trực thứ 7 (theo vòng)", fg: "#5B2C6F", bg: "#E6D6EE" },
  { code: "TCN", label: "Trực CN theo yêu cầu C/v", fg: "#5B2C6F", bg: "#E6D6EE" },
  { code: "HH", label: "Nghỉ việc hiếu hỷ", fg: "#8A5A00", bg: "#FCE8B8" },
];

export const ATTENDANCE_CODE_MAP = ATTENDANCE_CODES.reduce((acc, c) => {
  acc[c.code] = c;
  return acc;
}, {});

export const DUTY_CODES = ["T", "TT7", "TCN"];
export const REST_CODES = ["CN", "T7", "L", "N"];

export function daysInMonth(year, month1to12) {
  return new Date(year, month1to12, 0).getDate();
}

export function pad2(n) {
  return String(n).padStart(2, "0");
}

export function isoDate(year, month1to12, day) {
  return `${year}-${pad2(month1to12)}-${pad2(day)}`;
}

export const LEGEND_TEXT = ATTENDANCE_CODES.map((c) => `${c.code}: ${c.label}`).join(" · ");
