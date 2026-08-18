// Phiên đăng nhập (đang là ai trên THIẾT BỊ này) vẫn lưu cục bộ — mỗi máy/trình duyệt
// giữ trạng thái đăng nhập riêng, tương tự các ứng dụng web thông thường khác.
export function loadSession(fallback) {
  try {
    const raw = localStorage.getItem("duanfedex-session");
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function saveSession(value) {
  try {
    localStorage.setItem("duanfedex-session", JSON.stringify(value));
  } catch {
    // best effort
  }
}

// Dữ liệu dùng chung (nhân sự, công việc, các module...) giờ lưu ở CSDL trên máy chủ
// (Vercel + Upstash Redis) qua các API /api/*, để mọi người ở mọi thiết bị thấy cùng dữ liệu.
export async function fetchData(key, fallback) {
  try {
    const res = await fetch(`/api/data?key=${encodeURIComponent(key)}`);
    if (!res.ok) return fallback;
    const { value } = await res.json();
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

export async function persistData(key, value) {
  try {
    await fetch(`/api/data?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });
  } catch {
    // best effort — mất kết nối tạm thời, UI vẫn đã cập nhật lạc quan (optimistic)
  }
}

export async function loginRequest(email, password) {
  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { error: data.error || "Đăng nhập thất bại." };
  return { user: data.user };
}
