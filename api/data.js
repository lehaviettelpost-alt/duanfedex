import bcrypt from "bcryptjs";
import { redis } from "./_redis.js";

const USERS_KEY = "duanfedex-users";
const ALLOWED_PREFIXES = ["duanfedex-users", "duanfedex-tasks", "duanfedex-module-"];

function isAllowedKey(key) {
  return typeof key === "string" && ALLOWED_PREFIXES.some((p) => key === p || key.startsWith(p));
}

function stripPasswords(users) {
  return users.map(({ password: _password, ...rest }) => rest);
}

// Người dùng chỉ nhận danh sách "users" đã bị xóa mật khẩu (xem stripPasswords), nên khi họ
// lưu lại danh sách này (sửa thông tin, đổi vai trò…) mỗi bản ghi sẽ thiếu trường password.
// Phải lấy lại mật khẩu (đã băm) đang lưu trong CSDL theo id để không làm mất nó.
async function reconcileUserPasswords(incoming) {
  const existing = (await redis.get(USERS_KEY)) || [];
  const existingById = new Map(existing.map((u) => [u.id, u]));
  return Promise.all(
    incoming.map(async (u) => {
      if (u.password) {
        const alreadyHashed = String(u.password).startsWith("$2");
        return alreadyHashed ? u : { ...u, password: await bcrypt.hash(String(u.password), 10) };
      }
      const prev = existingById.get(u.id);
      if (prev?.password) return { ...u, password: prev.password };
      return { ...u, password: await bcrypt.hash("123456", 10) };
    })
  );
}

export default async function handler(req, res) {
  const key = req.query.key;
  if (!isAllowedKey(key)) {
    res.status(400).json({ error: "Invalid key" });
    return;
  }

  if (req.method === "GET") {
    let value = (await redis.get(key)) ?? [];
    if (key === USERS_KEY && Array.isArray(value)) value = stripPasswords(value);
    res.status(200).json({ value });
    return;
  }

  if (req.method === "POST") {
    let value = req.body?.value;
    if (key === USERS_KEY && Array.isArray(value)) {
      value = await reconcileUserPasswords(value);
    }
    await redis.set(key, value);
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
