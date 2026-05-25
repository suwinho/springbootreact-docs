"use client";

import { useState } from "react";
import { useDocumentMembers, Member } from "@/hooks/useDocumentMembers";
import styles from "./MembersPanel.module.css";

interface Props {
  documentId: string;
  token: string;
}

export default function MembersPanel({ documentId, token }: Props) {
  const { members, isLoading, inviteUser, changeRole, banUser, unbanUser } =
    useDocumentMembers(documentId, token);

  const [collapsed, setCollapsed] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("VIEWER");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  async function handleInvite() {
    if (!email.trim()) return;
    await inviteUser(email.trim(), role);
    setEmail("");
  }

  return (
    <aside className={styles.panel}>
      {/* Nagłówek — kliknij żeby zwinąć/rozwinąć */}
      <div className={styles.header} onClick={() => setCollapsed(!collapsed)}>
        <span>👥 Members ({members.length})</span>
        <span className={`${styles.chevron} ${collapsed ? styles.chevronDown : ""}`}>
          ▲
        </span>
      </div>

      {/* Treść — animacja rozwinięcia w górę */}
      <div className={`${styles.body} ${collapsed ? styles.collapsed : ""}`}>
        {/* Formularz zaproszenia */}
        <div className={styles.invite}>
          <input
            className={styles.input}
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <select
            className={styles.select}
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="VIEWER">Viewer</option>
            <option value="EDITOR">Editor</option>
          </select>
          <button className={styles.inviteBtn} onClick={handleInvite}>
            Invite
          </button>
        </div>

        {/* Lista */}
        <div className={styles.list}>
          {isLoading && <p className={styles.hint}>Loading...</p>}
          {members.map((m: Member) => (
            <div key={m.userId} className={styles.row}>
              <div className={styles.avatar}>
                {(m.displayName || m.username).charAt(0).toUpperCase()}
              </div>

              <div className={styles.info}>
                <span className={styles.name}>
                  {m.displayName || m.username}
                  {m.isBanned && <span className={styles.banned}>banned</span>}
                </span>
                <span className={styles.email}>{m.email}</span>
              </div>

              <span className={`${styles.role} ${styles[m.role.toLowerCase()]}`}>
                {m.role}
              </span>

              {m.role !== "OWNER" && (
                <div className={styles.menuWrap}>
                  <button
                    className={styles.menuBtn}
                    onClick={() => setOpenMenuId(openMenuId === m.userId ? null : m.userId)}
                  >
                    ⋮
                  </button>
                  {openMenuId === m.userId && (
                    <div className={styles.dropdown}>
                      {!m.isBanned && m.role !== "EDITOR" && (
                        <button onClick={() => { changeRole(m.userId, "EDITOR"); setOpenMenuId(null); }}>
                          Make Editor
                        </button>
                      )}
                      {!m.isBanned && m.role !== "VIEWER" && (
                        <button onClick={() => { changeRole(m.userId, "VIEWER"); setOpenMenuId(null); }}>
                          Make Viewer
                        </button>
                      )}
                      {m.isBanned ? (
                        <button onClick={() => { unbanUser(m.userId); setOpenMenuId(null); }}>
                          Restore access
                        </button>
                      ) : (
                        <button className={styles.dangerBtn} onClick={() => { banUser(m.userId); setOpenMenuId(null); }}>
                          Ban
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
