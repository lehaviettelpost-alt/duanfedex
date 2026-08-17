import { NotebookPen, FileText, Award, UserCheck, Link2, FileClock, MessageCircleHeart } from "lucide-react";

// Mỗi module dùng chung GenericModule.jsx để thêm/xóa/trả lời, lưu localStorage riêng theo "key".
// "required: false" đánh dấu trường không bắt buộc khi thêm mới.
export const GENERIC_MODULES = {
  giaoban: {
    key: "giaoban",
    label: "Sổ giao ban",
    icon: NotebookPen,
    fields: [
      { key: "date", label: "Ngày", type: "date" },
      { key: "title", label: "Tiêu đề", type: "text" },
      { key: "content", label: "Nội dung bàn giao", type: "textarea" },
      { key: "owner", label: "Người phụ trách", type: "user" },
    ],
  },
  // Văn bản chỉ đạo có giao diện riêng (VanBanPage.jsx: form + giao việc từ văn bản + danh sách)
  // thay vì bảng GenericModule — mục này chỉ giữ label/icon dùng chung cho Sidebar/Tổng quan.
  vanban: {
    key: "vanban",
    label: "Văn bản chỉ đạo",
    icon: FileText,
    fields: [],
  },
  chamdiem: {
    key: "chamdiem",
    label: "Chấm điểm",
    icon: Award,
    fields: [
      { key: "date", label: "Ngày", type: "date" },
      { key: "employee", label: "Nhân viên", type: "user" },
      { key: "score", label: "Điểm", type: "number" },
      { key: "note", label: "Ghi chú / tiêu chí", type: "text", required: false },
    ],
  },
  // Chấm công có giao diện bảng chấm công riêng (ChamCongPage.jsx) thay vì bảng GenericModule —
  // mục này chỉ giữ label/icon để Sidebar và Tổng quan dùng chung, dữ liệu vẫn lưu theo key "chamcong".
  chamcong: {
    key: "chamcong",
    label: "Chấm công",
    icon: UserCheck,
    fields: [],
  },
  link: {
    key: "link",
    label: "Quản lý link",
    icon: Link2,
    fields: [
      { key: "title", label: "Tên link", type: "text" },
      { key: "url", label: "URL", type: "url" },
      { key: "category", label: "Danh mục", type: "text", required: false },
      { key: "note", label: "Ghi chú", type: "text", required: false },
    ],
  },
  baocao: {
    key: "baocao",
    label: "Báo cáo cuối ngày",
    icon: FileClock,
    fields: [
      { key: "date", label: "Ngày", type: "date" },
      { key: "reporter", label: "Người báo cáo", type: "user" },
      { key: "content", label: "Công việc đã làm", type: "textarea" },
      { key: "issues", label: "Vấn đề tồn đọng", type: "textarea", required: false },
    ],
  },
  // Cấu hình trường của "Ý kiến phản hồi" vẫn khai báo ở đây (FeedbackPage.jsx dùng lại danh sách
  // category/status), nhưng module này có giao diện riêng (giống Công việc) thay vì bảng GenericModule.
  feedback: {
    key: "feedback",
    label: "Ý kiến phản hồi",
    icon: MessageCircleHeart,
    fields: [
      { key: "date", label: "Ngày", type: "date" },
      { key: "sender", label: "Người gửi", type: "user" },
      { key: "category", label: "Loại phản hồi", type: "select", options: ["Góp ý", "Khiếu nại", "Đề xuất", "Khác"] },
      { key: "content", label: "Nội dung phản hồi", type: "textarea" },
      { key: "status", label: "Trạng thái xử lý", type: "select", options: ["Chưa xử lý", "Đang xử lý", "Đã xử lý"] },
    ],
  },
};

export const GENERIC_MODULE_ORDER = ["giaoban", "vanban", "chamdiem", "chamcong", "link", "baocao", "feedback"];
