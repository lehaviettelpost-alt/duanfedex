import React, { useEffect, useMemo, useRef, useState } from "react";
import { Send, Users } from "lucide-react";
import { COLORS, hashColor, initials, fmtDateTime } from "../theme";

const GROUP_ID = null; // đại diện cho kênh "Chung" — mọi người trong công ty đều thấy

function lastMessageFor(records, currentEmail, targetEmail) {
  const inThread = records.filter((m) =>
    targetEmail === GROUP_ID
      ? m.type === "group"
      : m.type === "dm" && ((m.from === currentEmail && m.to === targetEmail) || (m.from === targetEmail && m.to === currentEmail))
  );
  return inThread[inThread.length - 1] || null;
}

export default function ChatPage({ records, users, currentUser, onPersist, onRefresh }) {
  const [target, setTarget] = useState(GROUP_ID); // null = kênh Chung, ngược lại là email người nhận
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => onRefresh(), 5000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const contacts = useMemo(
    () => users.filter((u) => u.email !== currentUser.email).sort((a, b) => a.name.localeCompare(b.name)),
    [users, currentUser.email]
  );

  const thread = useMemo(() => {
    return records
      .filter((m) =>
        target === GROUP_ID
          ? m.type === "group"
          : m.type === "dm" && ((m.from === currentUser.email && m.to === target) || (m.from === target && m.to === currentUser.email))
      )
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [records, target, currentUser.email]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [thread.length, target]);

  function userByEmail(email) {
    return users.find((u) => u.email === email);
  }

  function sendMessage() {
    if (!text.trim()) return;
    const newMessage = {
      id: "msg_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      type: target === GROUP_ID ? "group" : "dm",
      from: currentUser.email,
      to: target === GROUP_ID ? null : target,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };
    onPersist([...records, newMessage]);
    setText("");
  }

  const targetUser = target === GROUP_ID ? null : userByEmail(target);

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <h1 className="tb-title" style={{ fontSize: 26, fontWeight: 700, color: COLORS.ink, margin: 0 }}>Chat nội bộ</h1>
        <p style={{ color: COLORS.muted, fontSize: 14, margin: "4px 0 0" }}>Trò chuyện với cả phòng hoặc nhắn riêng theo danh bạ email</p>
      </div>

      <div style={{ display: "flex", gap: 16, background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: "hidden", minHeight: 520 }}>
        <div style={{ width: 240, flexShrink: 0, borderRight: `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "12px 14px", fontSize: 11, fontWeight: 700, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.4 }}>
            Kênh chung
          </div>
          <button
            onClick={() => setTarget(GROUP_ID)}
            style={{
              display: "flex", alignItems: "center", gap: 8, textAlign: "left", border: "none", cursor: "pointer",
              background: target === GROUP_ID ? COLORS.surface : "transparent", padding: "9px 14px",
            }}
          >
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: COLORS.accentGrad, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Users size={13} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink }}>Chung</div>
              <div style={{ fontSize: 11, color: COLORS.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {(() => {
                  const last = lastMessageFor(records, currentUser.email, GROUP_ID);
                  return last ? last.text : "Chưa có tin nhắn";
                })()}
              </div>
            </div>
          </button>

          <div style={{ padding: "12px 14px 6px", fontSize: 11, fontWeight: 700, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.4 }}>
            Nhắn riêng ({contacts.length})
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {contacts.map((u) => {
              const last = lastMessageFor(records, currentUser.email, u.email);
              const isActive = target === u.email;
              return (
                <button
                  key={u.id}
                  onClick={() => setTarget(u.email)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, textAlign: "left", border: "none", cursor: "pointer", width: "100%",
                    background: isActive ? COLORS.surface : "transparent", padding: "9px 14px",
                  }}
                >
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: hashColor(u.name), color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {initials(u.name)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: COLORS.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {last ? last.text : u.email}
                    </div>
                  </div>
                </button>
              );
            })}
            {contacts.length === 0 && <div style={{ padding: "0 14px", fontSize: 12, color: COLORS.muted }}>Chưa có nhân sự khác.</div>}
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderBottom: `1px solid ${COLORS.border}` }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700,
              background: target === GROUP_ID ? COLORS.accentGrad : hashColor(targetUser?.name || ""),
            }}>
              {target === GROUP_ID ? <Users size={13} /> : initials(targetUser?.name || "?")}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.ink }}>{target === GROUP_ID ? "Chung" : targetUser?.name || target}</div>
              {target !== GROUP_ID && <div style={{ fontSize: 11, color: COLORS.muted }}>{target}</div>}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            {thread.map((m) => {
              const isMine = m.from === currentUser.email;
              const author = userByEmail(m.from);
              return (
                <div key={m.id} style={{ display: "flex", flexDirection: isMine ? "row-reverse" : "row", gap: 8, alignItems: "flex-end" }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: hashColor(author?.name || m.from), color: "#fff", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {initials(author?.name || m.from)}
                  </div>
                  <div style={{ maxWidth: "70%" }}>
                    {target === GROUP_ID && !isMine && (
                      <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.muted, marginBottom: 2 }}>{author?.name || m.from}</div>
                    )}
                    <div style={{
                      background: isMine ? COLORS.accentGrad : COLORS.surface, color: isMine ? "#fff" : COLORS.ink,
                      borderRadius: 12, padding: "8px 12px", fontSize: 13.5, lineHeight: 1.5, whiteSpace: "pre-wrap",
                    }}>
                      {m.text}
                    </div>
                    <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 2, textAlign: isMine ? "right" : "left" }}>{fmtDateTime(m.createdAt)}</div>
                  </div>
                </div>
              );
            })}
            {thread.length === 0 && (
              <div style={{ fontSize: 13, color: COLORS.muted, textAlign: "center", padding: "24px 0" }}>Chưa có tin nhắn nào.</div>
            )}
            <div ref={bottomRef} />
          </div>

          <div style={{ display: "flex", gap: 8, padding: "12px 16px", borderTop: `1px solid ${COLORS.border}` }}>
            <input
              placeholder="Nhập tin nhắn…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              style={{ flex: 1, padding: "9px 12px", border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 13.5 }}
            />
            <button
              onClick={sendMessage}
              style={{ display: "flex", alignItems: "center", gap: 6, background: COLORS.accentGrad, color: "#fff", border: "none", borderRadius: 8, padding: "0 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              <Send size={14} /> Gửi
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
