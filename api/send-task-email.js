import nodemailer from "nodemailer";

const PRIORITY_LABELS = { high: "Cao", medium: "Trung bình", low: "Thấp" };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    res.status(500).json({ error: "Chưa cấu hình tài khoản gửi email." });
    return;
  }

  const {
    assigneeEmail, assigneeName, assignerName, assignerEmail,
    taskCode, title, description, priority, assignedDate, deadline,
  } = req.body || {};

  if (!assigneeEmail || !title) {
    res.status(400).json({ error: "Thiếu thông tin công việc hoặc email người nhận." });
    return;
  }

  const priorityLabel = PRIORITY_LABELS[priority] || priority || "—";
  const bodyLines = [
    `Xin chào ${assigneeName || ""},`,
    "",
    "Bạn vừa được giao một công việc mới trên Bản đồ công việc Dự án FedEx:",
    "",
    `Mã công việc: ${taskCode || "—"}`,
    `Tên công việc: ${title}`,
    description ? `Trích yếu: ${description}` : null,
    `Mức ưu tiên: ${priorityLabel}`,
    `Ngày giao: ${assignedDate || "—"}`,
    `Deadline: ${deadline || "—"}`,
    `Người giao: ${assignerName || "—"}`,
    "",
    "Vui lòng đăng nhập hệ thống để xem chi tiết và cập nhật tiến độ: https://duanfedex.vercel.app",
  ].filter((l) => l !== null);

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });
    await transporter.sendMail({
      from: `"${assignerName ? assignerName + " - " : ""}Dự án FedEx" <${process.env.GMAIL_USER}>`,
      to: assigneeEmail,
      replyTo: assignerEmail || process.env.GMAIL_USER,
      subject: `[Công việc mới] ${title}`,
      text: bodyLines.join("\n"),
    });
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Không gửi được email: " + err.message });
  }
}
