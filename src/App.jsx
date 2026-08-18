import React, { useState, useMemo, useEffect } from "react";
import { LogOut, Lock } from "lucide-react";
import { loadSession, saveSession, fetchData, persistData, loginRequest } from "./storage";
import { COLORS, ROLES, hashColor, initials } from "./theme";
import { GENERIC_MODULES, GENERIC_MODULE_ORDER } from "./modules";
import Sidebar from "./components/Sidebar";
import OverviewPage from "./components/OverviewPage";
import TasksPage from "./components/TasksPage";
import PersonnelPage from "./components/PersonnelPage";
import CalendarPage from "./components/CalendarPage";
import GenericModule from "./components/GenericModule";
import FeedbackPage from "./components/FeedbackPage";
import ChamCongPage from "./components/ChamCongPage";
import VanBanPage from "./components/VanBanPage";
import SoGiaoBanPage from "./components/SoGiaoBanPage";
import { BrandBadges } from "./components/BrandLogos";

const USERS_KEY = "duanfedex-users";
const TASKS_KEY = "duanfedex-tasks";
const moduleKey = (key) => `duanfedex-module-${key}`;

export default function App() {
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [moduleRecords, setModuleRecords] = useState({});
  const [currentUserId, setCurrentUserId] = useState(() => loadSession(null));
  const [sessionChecked, setSessionChecked] = useState(false);
  const [activeNav, setActiveNav] = useState("overview");

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);

  // Dữ liệu dùng chung giờ nằm trên máy chủ (Vercel + Upstash Redis) thay vì trình duyệt,
  // nên phải tải bất đồng bộ qua /api/data — mọi thiết bị/đăng nhập đều thấy cùng một dữ liệu.
  async function loadAllData() {
    const [u, t, ...mods] = await Promise.all([
      fetchData(USERS_KEY, []),
      fetchData(TASKS_KEY, []),
      ...GENERIC_MODULE_ORDER.map((k) => fetchData(moduleKey(k), [])),
    ]);
    setUsers(u);
    setTasks(t);
    const records = {};
    GENERIC_MODULE_ORDER.forEach((k, i) => { records[k] = mods[i]; });
    setModuleRecords(records);
  }

  // Nếu trình duyệt còn phiên đăng nhập từ trước, tải lại dữ liệu để xác nhận tài khoản đó
  // vẫn tồn tại trên máy chủ trước khi vào thẳng ứng dụng.
  useEffect(() => {
    if (!currentUserId) { setSessionChecked(true); return; }
    loadAllData().then(() => setSessionChecked(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentUser = useMemo(() => users.find((u) => u.id === currentUserId) || null, [users, currentUserId]);
  const isAdmin = currentUser?.role === "admin";
  const isSubadmin = currentUser?.role === "subadmin";
  const canManageTasks = isAdmin || isSubadmin;

  function persistUsers(next) {
    setUsers(next);
    persistData(USERS_KEY, next);
  }

  function persistTasks(next) {
    setTasks(next);
    persistData(TASKS_KEY, next);
  }

  function persistModule(key, next) {
    setModuleRecords((prev) => ({ ...prev, [key]: next }));
    persistData(moduleKey(key), next);
  }

  async function login() {
    setLoginBusy(true);
    const { user, error } = await loginRequest(loginForm.email.trim(), loginForm.password);
    if (!user) {
      setLoginError(error || "Email hoặc mật khẩu không đúng.");
      setLoginBusy(false);
      return;
    }
    await loadAllData();
    setCurrentUserId(user.id);
    saveSession(user.id);
    setLoginForm({ email: "", password: "" });
    setLoginError("");
    setSessionChecked(true);
    setLoginBusy(false);
  }

  function logout() {
    setCurrentUserId(null);
    saveSession(null);
    setActiveNav("overview");
    setUsers([]);
    setTasks([]);
    setModuleRecords({});
  }

  const pageStyle = { fontFamily: "'Inter', system-ui, sans-serif", background: COLORS.surface, minHeight: "100vh" };
  const globalStyle = (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500&family=Archivo+Black&family=Baloo+2:wght@500;600;700&display=swap');
      .tb-title { font-family: 'Space Grotesk', sans-serif; }
      .tb-mono { font-family: 'IBM Plex Mono', monospace; }
      .tb-card:hover { box-shadow: 0 2px 8px rgba(122,32,72,0.14); transform: translateY(-1px); }
      select, input, textarea, button { font-family: inherit; }
      .tb-shell { display: flex; min-height: 100vh; }
      .tb-sidebar { width: 230px; flex-shrink: 0; }
      .tb-content { flex: 1; min-width: 0; padding: 24px; }
      @media (max-width: 820px) {
        .tb-shell { flex-direction: column; }
        .tb-sidebar { width: 100%; }
        .tb-sidebar-list { flex-direction: row !important; overflow-x: auto; padding-bottom: 10px !important; }
      }
    `}</style>
  );

  const Logos = (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, justifyContent: "center" }}>
      <BrandBadges fedexHeight={20} viettelHeight={18} />
    </div>
  );

  // ---- Đang xác nhận phiên đăng nhập cũ (nếu có) trước khi quyết định hiển thị gì ----
  if (!sessionChecked) {
    return (
      <div style={{ ...pageStyle, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {globalStyle}
        <span style={{ color: COLORS.muted, fontSize: 14 }}>Đang tải…</span>
      </div>
    );
  }

  // ---- Login screen ----
  if (!currentUser) {
    return (
      <div style={{ ...pageStyle, padding: 24 }}>
        {globalStyle}
        <div style={{ maxWidth: 400, margin: "60px auto 0" }}>
          {Logos}
          <div style={{ background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 28 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 10, background: COLORS.accentGrad,
              display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14,
            }}>
              <Lock size={19} color="#fff" />
            </div>
            <h1 className="tb-title" style={{ fontSize: 21, fontWeight: 700, color: COLORS.ink, margin: "0 0 4px" }}>Đăng nhập</h1>
            <p style={{ color: COLORS.muted, fontSize: 13, margin: "0 0 20px" }}>Truy cập Bản đồ công việc Dự án Fedex</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input
                placeholder="Email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && login()}
                style={{ padding: "10px 12px", border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 14 }}
              />
              <input
                type="password"
                placeholder="Mật khẩu"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && login()}
                style={{ padding: "10px 12px", border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 14 }}
              />
              <button
                onClick={login}
                disabled={loginBusy}
                style={{
                  background: COLORS.accentGrad, color: "#fff", border: "none",
                  borderRadius: 6, padding: "10px 14px", fontSize: 14, fontWeight: 600,
                  cursor: loginBusy ? "default" : "pointer", opacity: loginBusy ? 0.7 : 1, marginTop: 4,
                }}
              >
                {loginBusy ? "Đang đăng nhập…" : "Đăng nhập"}
              </button>
            </div>
            {loginError && <div style={{ color: COLORS.danger, fontSize: 13, marginTop: 10 }}>{loginError}</div>}
          </div>
        </div>
      </div>
    );
  }

  // ---- Main app shell ----
  let page = null;
  if (activeNav === "overview") {
    page = <OverviewPage tasks={tasks} users={users} moduleRecords={moduleRecords} currentUser={currentUser} onNavigate={setActiveNav} />;
  } else if (activeNav === "tasks") {
    page = <TasksPage tasks={tasks} users={users} currentUser={currentUser} isAdmin={isAdmin} canManageTasks={canManageTasks} onPersistTasks={persistTasks} />;
  } else if (activeNav === "personnel") {
    page = <PersonnelPage users={users} currentUser={currentUser} isAdmin={isAdmin} isSubadmin={isSubadmin} onPersistUsers={persistUsers} />;
  } else if (activeNav === "calendar") {
    page = <CalendarPage tasks={tasks} />;
  } else if (activeNav === "feedback") {
    page = (
      <FeedbackPage
        records={moduleRecords.feedback || []}
        users={users}
        currentUser={currentUser}
        canManage={canManageTasks}
        onPersist={(next) => persistModule("feedback", next)}
      />
    );
  } else if (activeNav === "chamcong") {
    page = (
      <ChamCongPage
        records={moduleRecords.chamcong || []}
        users={users}
        canManage={canManageTasks}
        onPersist={(next) => persistModule("chamcong", next)}
      />
    );
  } else if (activeNav === "vanban") {
    page = (
      <VanBanPage
        records={moduleRecords.vanban || []}
        users={users}
        canManage={canManageTasks}
        onPersist={(next) => persistModule("vanban", next)}
      />
    );
  } else if (activeNav === "giaoban") {
    page = (
      <SoGiaoBanPage
        records={moduleRecords.giaoban || []}
        users={users}
        canManage={canManageTasks}
        onPersist={(next) => persistModule("giaoban", next)}
      />
    );
  } else if (GENERIC_MODULES[activeNav]) {
    const key = activeNav;
    page = (
      <GenericModule
        config={GENERIC_MODULES[key]}
        records={moduleRecords[key] || []}
        users={users}
        currentUser={currentUser}
        canManage={canManageTasks}
        canAdd={canManageTasks}
        onPersist={(next) => persistModule(key, next)}
      />
    );
  }

  return (
    <div style={pageStyle}>
      {globalStyle}
      <div className="tb-shell">
        <Sidebar active={activeNav} onNavigate={setActiveNav} />

        <div className="tb-content">
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <span />
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                <BrandBadges fedexHeight={32} viettelHeight={27} />
              </div>

              <div style={{ justifySelf: "end", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: "50%", background: hashColor(currentUser.name),
                    color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    {initials(currentUser.name)}
                  </div>
                  <div style={{ lineHeight: 1.15 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink }}>{currentUser.name}</div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: ROLES[currentUser.role].fg, background: ROLES[currentUser.role].bg, borderRadius: 4, padding: "1px 6px" }}>
                      {ROLES[currentUser.role].label}
                    </span>
                  </div>
                </div>
                <button
                  onClick={logout}
                  style={{ display: "flex", alignItems: "center", gap: 5, background: "#fff", color: COLORS.muted, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "7px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                >
                  <LogOut size={13} /> Đăng xuất
                </button>
              </div>
            </div>

            {page}
          </div>
        </div>
      </div>
    </div>
  );
}
