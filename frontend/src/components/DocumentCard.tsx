'use client';

import { useRouter } from 'next/navigation';
import styles from './DocumentCard.module.css';

export type DocumentStatus = 'active' | 'idle';

export interface DocumentMeta {
  id: string;
  title: string;
  lastModified: string;
  editors: string[];
  size: string;
  status: DocumentStatus;
}

interface Props {
  document: DocumentMeta;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function DocumentCard({ document: doc }: Props) {
  const router = useRouter();

  return (
    <article
      id={`doc-card-${doc.id}`}
      className={styles.card}
      onClick={() => router.push(`/editor/${doc.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') router.push(`/editor/${doc.id}`);
      }}
      aria-label={`Otwórz dokument: ${doc.title}`}
    >
      <div className={styles.iconWrap}>
        <svg className={styles.docIcon} viewBox="0 0 40 48" fill="none">
          <rect width="40" height="48" rx="6" fill="url(#docGrad)" />
          <path d="M10 17h20M10 23h20M10 29h14" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
          <rect x="26" y="2" width="12" height="12" rx="2" fill="white" opacity="0.15" />
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
          <h3 className={styles.title}>{doc.title}</h3>
          <span className={`${styles.statusBadge} ${doc.status === 'active' ? styles.statusActive : styles.statusIdle}`}>
            {doc.status === 'active' ? (
              <>
                <span className={styles.statusDot} />
                Aktywny
              </>
            ) : 'Nieaktywny'}
          </span>
        </div>

        <p className={styles.meta}>
          Zmodyfikowano: {formatDate(doc.lastModified)}
        </p>

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
                  {name.split(' ').map((n) => n[0]).join('').toUpperCase()}
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
                ? `${doc.editors[0]} edytuje`
                : `${doc.editors.length} osoby edytują`}
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
          Otwórz
          <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
            <path fillRule="evenodd" d="M4.22 12.22a.75.75 0 001.06 0L11 6.5v3.75a.75.75 0 001.5 0V4.75a.75.75 0 00-.75-.75H6.25a.75.75 0 000 1.5H10L4.22 11.16a.75.75 0 000 1.06z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </article>
  );
}
