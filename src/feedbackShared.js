import { GENERIC_MODULES } from "./modules";

const FEEDBACK_CONFIG = GENERIC_MODULES.feedback;

export const CATEGORY_OPTIONS = FEEDBACK_CONFIG.fields.find((f) => f.key === "category").options;
export const STATUS_OPTIONS = FEEDBACK_CONFIG.fields.find((f) => f.key === "status").options;

export const CATEGORY_COLORS = {
  "Góp ý": { fg: "#1D5FA8", bg: "#D7E6F5" },
  "Khiếu nại": { fg: "#C0392B", bg: "#F6D7D2" },
  "Đề xuất": { fg: "#1F6B4A", bg: "#D3EFDE" },
  "Khác": { fg: "#6B3F14", bg: "#F3E1C4" },
};

export const STATUS_COLORS = {
  "Chưa xử lý": { fg: "#8A6B78", bg: "#F0E1E8" },
  "Đang xử lý": { fg: "#8A5A00", bg: "#FCE8B8" },
  "Đã xử lý": { fg: "#1F6B4A", bg: "#D3EFDE" },
};
