import React, { useState } from "react";
import { UserPlus, X, Users, Pencil } from "lucide-react";
import { COLORS, ROLES, hashColor, initials, isValidGmail, nameFromEmail, inputStyle, cardStyle } from "../theme";

const UNITS = [
  "Dispatch Bắc Ninh",
  "Dispatch Long Biên",
  "Dispatch Tây Hồ",
  "Dispatch Thanh Xuân",
  "Station ALS",
  "Dispatch Từ Liêm",
  "Dispatch Hải Phòng",
  "Dispatch Hải Dương",
  "Dispatch Hưng Yên",
  "Dispatch Nam Định",
  "Khối gián tiếp Dự án",
];

const EMPTY_ADD_USER_FORM = { name: "", email: "", employeeCode: "", unit: UNITS[0], phone: "", position: "", role: "member", password: "" };

export default function PersonnelPage({ users, currentUser, isAdmin, isSubadmin, onPersistUsers }) {
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [addUserForm, setAddUserForm] = useState(EMPTY_ADD_USER_FORM);
  const [addUserError, setAddUserError] = useState("");
  const [quickAddForm, setQuickAddForm] = useState({ name: "", email: "" });
  const [quickAddError, setQuickAddError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editError, setEditError] = useState("");

  function addUser() {
    if (!isAdmin) return;
    const email = addUserForm.email.trim();
    if (!isValidGmail(email)) { setAddUserError("Nhập địa chỉ Gmail hợp lệ (vd: ten@gmail.com)."); return; }
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) { setAddUserError("Email này đã tồn tại trong hệ thống."); return; }
    const newUser = {
      id: "u" + Date.now(),
      name: addUserForm.name.trim() || nameFromEmail(email),
      email,
      employeeCode: addUserForm.employeeCode.trim(),
      unit: addUserForm.unit,
      phone: addUserForm.phone.trim(),
      position: addUserForm.position.trim(),
      role: addUserForm.role,
      password: addUserForm.password.trim() || "123456",
    };
    onPersistUsers([...users, newUser]);
    setAddUserForm(EMPTY_ADD_USER_FORM);
    setAddUserError("");
    setShowAddUserForm(false);
  }

  function addMemberByGmail() {
    if (!isSubadmin) return;
    const email = quickAddForm.email.trim();
    if (!isValidGmail(email)) { setQuickAddError("Nhập địa chỉ Gmail hợp lệ (vd: ten@gmail.com)."); return; }
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) { setQuickAddError("Email này đã tồn tại trong hệ thống."); return; }
    const newUser = { id: "u" + Date.now(), name: quickAddForm.name.trim() || nameFromEmail(email), email, phone: "", position: "", role: "member", password: "123456" };
    onPersistUsers([...users, newUser]);
    setQuickAddForm({ name: "", email: "" });
    setQuickAddError("");
    setShowAddUserForm(false);
  }

  function updateUserRole(id, role) {
    if (!isAdmin || id === currentUser?.id) return;
    onPersistUsers(users.map((u) => (u.id === id ? { ...u, role } : u)));
  }

  function removeUser(id) {
    const target = users.find((u) => u.id === id);
    if (!target) return;
    const allowed = isAdmin ? target.id !== currentUser.id : isSubadmin && target.role === "member";
    if (!allowed) return;
    onPersistUsers(users.filter((u) => u.id !== id));
  }

  function startEdit(u) {
    setEditingId(u.id);
    setEditForm({
      name: u.name, email: u.email, employeeCode: u.employeeCode || "",
      unit: u.unit || UNITS[0], phone: u.phone || "", position: u.position || "",
    });
    setEditError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(null);
    setEditError("");
  }

  function saveEdit() {
    const email = editForm.email.trim();
    if (!isValidGmail(email)) { setEditError("Nhập địa chỉ Gmail hợp lệ (vd: ten@gmail.com)."); return; }
    if (users.some((u) => u.id !== editingId && u.email.toLowerCase() === email.toLowerCase())) {
      setEditError("Email này đã được dùng bởi nhân sự khác.");
      return;
    }
    onPersistUsers(users.map((u) => (u.id === editingId ? {
      ...u,
      name: editForm.name.trim() || u.name,
      email,
      employeeCode: editForm.employeeCode.trim(),
      unit: editForm.unit,
      phone: editForm.phone.trim(),
      position: editForm.position.trim(),
    } : u)));
    cancelEdit();
  }

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <h1 className="tb-title" style={{ fontSize: 26, fontWeight: 700, color: COLORS.ink, margin: 0 }}>Nhân sự</h1>
        <p style={{ color: COLORS.muted, fontSize: 14, margin: "4px 0 0" }}>Khai báo thông tin và cấp quyền cho nhân sự</p>
      </div>

      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 6, color: COLORS.ink }}>
            <Users size={15} /> {isAdmin ? `Quản lý nhân sự (${users.length})` : `Nhân sự (${users.length})`}
          </span>
          <button
            onClick={() => setShowAddUserForm((s) => !s)}
            style={{
              display: "flex", alignItems: "center", gap: 6, background: "#fff", color: COLORS.purple,
              border: `1px solid ${COLORS.purple}`, borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            <UserPlus size={14} /> {isAdmin ? "Thêm nhân sự" : "Thêm nhân sự (Gmail)"}
          </button>
        </div>

        {showAddUserForm && isAdmin && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8, alignItems: "center", marginBottom: 12, background: "#FBF2F6", borderRadius: 8, padding: 10 }}>
            <input placeholder="Họ tên (bỏ trống để tự lấy từ Gmail)" value={addUserForm.name} onChange={(e) => setAddUserForm({ ...addUserForm, name: e.target.value })} style={inputStyle} />
            <input placeholder="ten@gmail.com" value={addUserForm.email} onChange={(e) => setAddUserForm({ ...addUserForm, email: e.target.value })} style={inputStyle} />
            <input placeholder="Mã nhân viên" value={addUserForm.employeeCode} onChange={(e) => setAddUserForm({ ...addUserForm, employeeCode: e.target.value })} style={inputStyle} />
            <select value={addUserForm.unit} onChange={(e) => setAddUserForm({ ...addUserForm, unit: e.target.value })} style={inputStyle}>
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
            <input placeholder="Số điện thoại" value={addUserForm.phone} onChange={(e) => setAddUserForm({ ...addUserForm, phone: e.target.value })} style={inputStyle} />
            <input placeholder="Chức vụ" value={addUserForm.position} onChange={(e) => setAddUserForm({ ...addUserForm, position: e.target.value })} style={inputStyle} />
            <select value={addUserForm.role} onChange={(e) => setAddUserForm({ ...addUserForm, role: e.target.value })} style={inputStyle}>
              {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <input placeholder="Mật khẩu (mặc định 123456)" value={addUserForm.password} onChange={(e) => setAddUserForm({ ...addUserForm, password: e.target.value })} style={inputStyle} />
            <button onClick={addUser} style={{ background: COLORS.ink, color: "#fff", border: "none", borderRadius: 6, padding: "9px 14px", fontSize: 14, cursor: "pointer" }}>
              Thêm nhân sự
            </button>
          </div>
        )}
        {showAddUserForm && isAdmin && addUserError && <div style={{ color: COLORS.danger, fontSize: 13, marginBottom: 10 }}>{addUserError}</div>}

        {showAddUserForm && isSubadmin && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, alignItems: "center", marginBottom: 12, background: "#FBF2F6", borderRadius: 8, padding: 10 }}>
            <input placeholder="Tên (bỏ trống để tự lấy từ Gmail)" value={quickAddForm.name} onChange={(e) => setQuickAddForm({ ...quickAddForm, name: e.target.value })} style={inputStyle} />
            <input placeholder="ten@gmail.com" value={quickAddForm.email} onChange={(e) => setQuickAddForm({ ...quickAddForm, email: e.target.value })} style={inputStyle} />
            <button onClick={addMemberByGmail} style={{ background: COLORS.ink, color: "#fff", border: "none", borderRadius: 6, padding: "8px 14px", fontSize: 14, cursor: "pointer" }}>
              Thêm
            </button>
          </div>
        )}
        {showAddUserForm && isSubadmin && (
          <div style={{ color: COLORS.muted, fontSize: 12, marginBottom: 10 }}>Mật khẩu mặc định cho tài khoản mới: <strong>123456</strong></div>
        )}
        {showAddUserForm && isSubadmin && quickAddError && <div style={{ color: COLORS.danger, fontSize: 13, marginBottom: 10 }}>{quickAddError}</div>}

        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 1110 }}>
            <div style={{
              display: "grid", gridTemplateColumns: "1.4fr 1.4fr 0.9fr 1fr 1.3fr 1.2fr 0.9fr auto auto",
              gap: 10, padding: "0 10px 6px", fontSize: 11, fontWeight: 600, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.4,
            }}>
              <span>Nhân sự</span><span>Email</span><span>Mã NV</span><span>Điện thoại</span><span>Đơn vị</span><span>Chức vụ</span><span>Vai trò</span><span /><span />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {users.map((u) => {
                const isSelf = u.id === currentUser.id;
                const canManageThis = isAdmin || (isSubadmin && u.role === "member");
                const canDelete = isAdmin ? !isSelf : canManageThis;
                const canEdit = canManageThis;
                const isEditing = editingId === u.id;
                return (
                  <div key={u.id}>
                    <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1.4fr 0.9fr 1fr 1.3fr 1.2fr 0.9fr auto auto", gap: 10, alignItems: "center", background: COLORS.surface, borderRadius: isEditing ? "8px 8px 0 0" : 8, padding: "8px 10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: "50%", background: hashColor(u.name),
                          color: "#fff", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                          {initials(u.name)}
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {u.name}{isSelf && " (Bạn)"}
                        </span>
                      </div>
                      <span style={{ fontSize: 12, color: COLORS.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</span>
                      <span className="tb-mono" style={{ fontSize: 12, color: COLORS.muted }}>{u.employeeCode || "—"}</span>
                      <span style={{ fontSize: 12, color: COLORS.muted }}>{u.phone || "—"}</span>
                      <span style={{ fontSize: 12, color: COLORS.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.unit || "—"}</span>
                      <span style={{ fontSize: 12, color: COLORS.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.position || "—"}</span>
                      {isAdmin ? (
                        <select
                          value={u.role}
                          disabled={isSelf}
                          onChange={(e) => updateUserRole(u.id, e.target.value)}
                          style={{ fontSize: 11, fontWeight: 600, color: ROLES[u.role].fg, background: ROLES[u.role].bg, border: "none", borderRadius: 5, padding: "4px 6px" }}
                        >
                          {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 600, color: ROLES[u.role].fg, background: ROLES[u.role].bg, borderRadius: 5, padding: "4px 6px", justifySelf: "start" }}>
                          {ROLES[u.role].label}
                        </span>
                      )}
                      {canEdit ? (
                        <Pencil
                          size={13}
                          style={{ cursor: "pointer", color: isEditing ? COLORS.purple : "#B08A9A", justifySelf: "center" }}
                          onClick={() => (isEditing ? cancelEdit() : startEdit(u))}
                        />
                      ) : <span />}
                      {canDelete ? <X size={14} style={{ cursor: "pointer", color: "#B08A9A", justifySelf: "end" }} onClick={() => removeUser(u.id)} /> : <span />}
                    </div>

                    {isEditing && (
                      <div style={{ background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: "0 0 8px 8px", padding: 10 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8, marginBottom: 8 }}>
                          <input placeholder="Họ tên" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} style={inputStyle} />
                          <input placeholder="ten@gmail.com" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} style={inputStyle} />
                          <input placeholder="Mã nhân viên" value={editForm.employeeCode} onChange={(e) => setEditForm({ ...editForm, employeeCode: e.target.value })} style={inputStyle} />
                          <input placeholder="Số điện thoại" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} style={inputStyle} />
                          <select value={editForm.unit} onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })} style={inputStyle}>
                            {UNITS.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                          </select>
                          <input placeholder="Chức vụ" value={editForm.position} onChange={(e) => setEditForm({ ...editForm, position: e.target.value })} style={inputStyle} />
                        </div>
                        {editError && <div style={{ color: COLORS.danger, fontSize: 12, marginBottom: 8 }}>{editError}</div>}
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={saveEdit} style={{ background: COLORS.ink, color: "#fff", border: "none", borderRadius: 6, padding: "8px 14px", fontSize: 13, cursor: "pointer" }}>
                            Lưu thay đổi
                          </button>
                          <button onClick={cancelEdit} style={{ background: "#fff", color: COLORS.muted, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "8px 14px", fontSize: 13, cursor: "pointer" }}>
                            Hủy
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {users.length === 0 && <span style={{ fontSize: 12, color: COLORS.muted }}>Chưa có nhân sự nào, hãy thêm mới.</span>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
