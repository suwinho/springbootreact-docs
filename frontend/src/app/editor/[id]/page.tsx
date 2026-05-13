'use client';

import { useParams, useRouter } from 'next/navigation';
import styles from './editor.module.css';

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <button className={styles.backBtn} onClick={() => router.push('/dashboard')}>
          <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Wróć
        </button>
        <span className={styles.docId}>Dokument #{id}</span>
        <div className={styles.editorBadge}>
          <span className={styles.editorDot} />
          Połączony
        </div>
      </div>

      <div className={styles.placeholder}>
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <rect width="64" height="64" rx="16" fill="url(#edGrad)" />
          <path d="M16 22h32M16 32h24M16 42h28" stroke="white" strokeWidth="3" strokeLinecap="round" />
          <defs>
            <linearGradient id="edGrad" x1="0" y1="0" x2="64" y2="64">
              <stop stopColor="#6366f1" />
              <stop offset="1" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>
        <h2>Edytor dokumentów</h2>
        <p>
          Tu będzie działał kolaboratywny edytor Word z obsługą WebSocket.<br />
          Real-time OT/CRDT — wkrótce! 🚀
        </p>
      </div>
    </div>
  );
}
