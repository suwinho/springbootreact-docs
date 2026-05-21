"use client";

import { useParams, useRouter } from "next/navigation";
import styles from "./editor.module.css";
import Editor from "@/components/Editor";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const [myRole, setMyRole] = useState<string | null>(null);
  const router = useRouter();
  const { data: session, status } = useSession();
  const accessToken = (session as any)?.accessToken;

  useEffect(() => {
    fetch(`/api/document/${id}/my-role`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.json())
      .then((data) => setMyRole(data.role))
      .catch(() => setMyRole("VIEWER"));
  }, [id, accessToken]);

  const isReadOnly = myRole === "VIEWER";

  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <button
          className={styles.backBtn}
          onClick={() => router.push("/dashboard")}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Back
        </button>
        <span className={styles.docId}>Document #{id}</span>
        <div className={styles.editorBadge}>
          <span className={styles.editorDot} />
          Connected
        </div>
      </div>

      <div className={styles.placeholder}>
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <rect width="64" height="64" rx="16" fill="url(#edGrad)" />
          <path
            d="M16 22h32M16 32h24M16 42h28"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="edGrad" x1="0" y1="0" x2="64" y2="64">
              <stop stopColor="#6366f1" />
              <stop offset="1" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>
        <h2>Document editor</h2>
        <div>
          <Editor readOnly={isReadOnly} documentId={id} token={accessToken} />
        </div>
      </div>
    </div>
  );
}
