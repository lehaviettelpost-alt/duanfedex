import bcrypt from "bcryptjs";
import { redis } from "./_redis.js";

const USERS_KEY = "duanfedex-users";
const SEED_ADMIN = { id: "u1", name: "Quản trị viên", email: "admin@duanfedex.vn", phone: "", position: "Quản trị hệ thống", role: "admin" };

// Đảm bảo luôn có ít nhất 1 tài khoản Admin trong CSDL dùng chung, kể cả lần chạy đầu tiên
// hoặc nếu dữ liệu Admin từng bị xóa nhầm — tránh khóa hoàn toàn quyền truy cập hệ thống.
async function ensureUsers() {
  let users = await redis.get(USERS_KEY);
  if (!Array.isArray(users)) users = [];
  if (!users.some((u) => u.role === "admin")) {
    const hashed = await bcrypt.hash("admin123", 10);
    users = [...users, { ...SEED_ADMIN, password: hashed }];
    await redis.set(USERS_KEY, users);
  }
  return users;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const { email, password } = req.body || {};
  if (!email || !password) {
    res.status(400).json({ error: "Thiếu email hoặc mật khẩu." });
    return;
  }

  const users = await ensureUsers();
  const user = users.find((u) => (u.email || "").toLowerCase() === String(email).toLowerCase());
  if (!user) {
    res.status(401).json({ error: "Email hoặc mật khẩu không đúng." });
    return;
  }

  const stored = user.password || "";
  const isHashed = stored.startsWith("$2");
  const ok = isHashed ? await bcrypt.compare(password, stored) : password === stored;
  if (!ok) {
    res.status(401).json({ error: "Email hoặc mật khẩu không đúng." });
    return;
  }

  const { password: _pw, ...safeUser } = user;
  res.status(200).json({ user: safeUser });
}
