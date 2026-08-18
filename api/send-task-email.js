const PRIORITY_LABELS = { high: "Cao", medium: "Trung bình", low: "Thấp" };

// Gmail SMTP trực tiếp bị Google chặn khi đăng nhập từ IP máy chủ đám mây (Vercel) dù App
// Password đúng — nên dùng Resend (HTTP API) làm nơi gửi thật; Reply-To vẫn trỏ về Gmail
// thật của người giao việc để người nhận bấm "Trả lời" là tới đúng người.
const RESEND_FROM = "Dự án FedEx <onboarding@resend.dev>";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  let resendApiKey = process.env.RESEND_API_KEY || "";
  if (resendApiKey.charCodeAt(0) === 0xFEFF) resendApiKey = resendApiKey.slice(1);
  resendApiKey = resendApiKey.trim();
  if (!resendApiKey) {
    res.status(500).json({ error: "Chưa cấu hình dịch vụ gửi email." });
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
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [assigneeEmail],
        reply_to: assignerEmail || undefined,
        subject: `[Công việc mới] ${title}`,
        text: bodyLines.join("\n"),
      }),
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      res.status(502).json({ error: "Không gửi được email: " + (data.message || resp.statusText) });
      return;
    }
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Không gửi được email: " + err.message });
  }
}
