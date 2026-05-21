"use client";

import { useRouter } from "next/navigation";
import styles from "./DocumentCard.module.css";
import { useState } from "react";

export type DocumentStatus = "active" | "idle";

export interface DocumentMeta {
  id: string;
  title: string;
  lastModified: string;
  editors: string[];
  size: string;
  status: DocumentStatus;
  ownerUsername: string;
  myRole: "OWNER" | "EDITOR" | "VIEWER";
}

interface Props {
  document: DocumentMeta;
  token: string;
  onRenamed?: () => void;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DocumentCard({
  document: doc,
  token,
  onRenamed,
}: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [titleValue, setTitleValue] = useState(doc.title);

  const handleRenameBlur = async () => {
    setEditing(false);
    if (titleValue.trim() === "") {
      setTitleValue(doc.title);
      return;
    }
    if (titleValue !== doc.title) {
      await fetch(`/api/documents/${doc.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: titleValue }),
      });
      onRenamed?.();
    }
  };
  return (
    <article
      id={`doc-card-${doc.id}`}
      className={styles.card}
      onClick={() => router.push(`/editor/${doc.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ")
          router.push(`/editor/${doc.id}`);
      }}
      aria-label={`Open document: ${doc.title}`}
    >
      <div className={styles.iconWrap}>
        <svg className={styles.docIcon} viewBox="0 0 40 48" fill="none">
          <rect width="40" height="48" rx="6" fill="url(#docGrad)" />
          <path
            d="M10 17h20M10 23h20M10 29h14"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.9"
          />
          <rect
            x="26"
            y="2"
            width="12"
            height="12"
            rx="2"
            fill="white"
            opacity="0.15"
          />
          <defs>
            <linearGradient id="docGrad" x1="0" y1="0" x2="40" y2="48">
              <stop stopColor="#6366f1" />
              <stop offset="1" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>
        <span className={styles.docExt}>DOCX</span>
      </div>

      <div className={styles.content}>
        <div className={styles.topRow}>
          {editing ? (
            <input
              className={styles.titleInput}
              value={titleValue}
              autoFocus
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleRenameBlur}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                if (e.key === "Escape") {
                  setTitleValue(doc.title);
                  setEditing(false);
                }
              }}
            />
          ) : (
            <div className={styles.titleRow}>
              <h3 className={styles.title}>{titleValue}</h3>
              <button
                id={`rename-doc-${doc.id}`}
                className={styles.renameBtn}
                title="Rename document"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditing(true);
                }}
              >
                <svg
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  width="13"
                  height="13"
                >
                  <path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 00-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 000-.354l-1.086-1.086zM11.189 6.25L9.75 4.81l-6.286 6.287a.25.25 0 00-.064.108l-.558 1.953 1.953-.558a.25.25 0 00.108-.064L11.189 6.25z" />
                </svg>
              </button>
            </div>
          )}
          <span
            className={`${styles.statusBadge} ${doc.status === "active" ? styles.statusActive : styles.statusIdle}`}
          >
            {doc.status === "active" ? (
              <>
                <span className={styles.statusDot} />
                Active
              </>
            ) : (
              "Inactive"
            )}
          </span>
        </div>

        <p className={styles.meta}>Modified: {formatDate(doc.lastModified)}</p>

        {doc.ownerUsername && (
          <p className={styles.owner}>Owner: {doc.ownerUsername}</p>
        )}

        {doc.editors.length > 0 && (
          <div className={styles.editorsRow}>
            <div className={styles.avatarStack}>
              {doc.editors.slice(0, 3).map((name, i) => (
                <span
                  key={name}
                  className={styles.editorAvatar}
                  style={{ zIndex: doc.editors.length - i }}
                  title={name}
                >
                  {name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </span>
              ))}
              {doc.editors.length > 3 && (
                <span className={`${styles.editorAvatar} ${styles.editorMore}`}>
                  +{doc.editors.length - 3}
                </span>
              )}
            </div>
            <span className={styles.editorsLabel}>
              {doc.editors.length === 1
                ? `${doc.editors[0]} is editing`
                : `${doc.editors.length} people editing`}
            </span>
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <span className={styles.size}>{doc.size}</span>
        <button
          id={`open-doc-${doc.id}`}
          className={styles.openBtn}
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/editor/${doc.id}`);
          }}
        >
          Open
          <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
            <path
              fillRule="evenodd"
              d="M4.22 12.22a.75.75 0 001.06 0L11 6.5v3.75a.75.75 0 001.5 0V4.75a.75.75 0 00-.75-.75H6.25a.75.75 0 000 1.5H10L4.22 11.16a.75.75 0 000 1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </article>
  );
}
