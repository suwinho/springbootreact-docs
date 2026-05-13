'use client';

import { signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import DocumentCard from '@/components/DocumentCard';
import styles from './dashboard.module.css';

const MOCK_DOCUMENTS = [
  {
    id: '1',
    title: 'Specyfikacja Projektu',
    lastModified: '2026-05-12T12:30:00Z',
    editors: ['Anna K.', 'Marek P.'],
    size: '124 KB',
    status: 'active' as const,
  },
  {
    id: '2',
    title: 'Raport Miesięczny — Maj 2026',
    lastModified: '2026-05-11T09:15:00Z',
    editors: ['Jan W.'],
    size: '87 KB',
    status: 'active' as const,
  },
  {
    id: '3',
    title: 'Protokół Spotkania',
    lastModified: '2026-05-10T16:45:00Z',
    editors: [],
    size: '42 KB',
    status: 'idle' as const,
  },
  {
    id: '4',
    title: 'Plan Wdrożenia v2',
    lastModified: '2026-05-09T11:00:00Z',
    editors: ['Anna K.', 'Piotr D.', 'Kasia M.'],
    size: '256 KB',
    status: 'active' as const,
  },
  {
    id: '5',
    title: 'Umowa Serwisowa',
    lastModified: '2026-05-08T14:20:00Z',
    editors: [],
    size: '198 KB',
    status: 'idle' as const,
  },
  {
    id: '6',
    title: 'Regulamin Wewnętrzny',
    lastModified: '2026-05-07T08:00:00Z',
    editors: ['Jan W.', 'Marek P.'],
    size: '311 KB',
    status: 'active' as const,
  },
];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner} />
        <p>Ładowanie...</p>
      </div>
    );
  }

  const userName = session?.user?.name ?? session?.user?.email ?? 'Użytkownik';
  const userInitials = userName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const activeCount = MOCK_DOCUMENTS.filter((d) => d.status === 'active').length;

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="10" fill="url(#sideGrad)" />
            <path d="M9 10h14M9 16h10M9 22h12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            <defs>
              <linearGradient id="sideGrad" x1="0" y1="0" x2="32" y2="32">
                <stop stopColor="#6366f1" />
                <stop offset="1" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
          <span>DocCollab</span>
        </div>

        <nav className={styles.sidebarNav}>
          <a href="#" id="nav-dashboard" className={`${styles.navItem} ${styles.navItemActive}`}>
            <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            Dashboard
          </a>
          <a href="#" id="nav-documents" className={styles.navItem}>
            <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
            </svg>
            Moje Dokumenty
          </a>
          <a href="#" id="nav-shared" className={styles.navItem}>
            <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
            </svg>
            Udostępnione
          </a>
          <a href="#" id="nav-recent" className={styles.navItem}>
            <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            Ostatnie
          </a>
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>{userInitials}</div>
            <div className={styles.userDetails}>
              <span className={styles.userName}>{userName}</span>
              <span className={styles.userRole}>Editor</span>
            </div>
          </div>
          <button
            id="logout-btn"
            className={styles.logoutBtn}
            onClick={() => signOut({ callbackUrl: '/login' })}
            title="Wyloguj"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className={styles.main}>
        {/* Header */}
        <header className={styles.header}>
          <div>
            <h1 className={styles.headerTitle}>Dashboard</h1>
            <p className={styles.headerSubtitle}>Zarządzaj swoimi dokumentami</p>
          </div>
          <button id="new-doc-btn" className={styles.newDocBtn}>
            <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Nowy dokument
          </button>
        </header>

        {/* Stats */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{MOCK_DOCUMENTS.length}</span>
            <span className={styles.statLabel}>Wszystkich dokumentów</span>
          </div>
          <div className={styles.statCard}>
            <span className={`${styles.statValue} ${styles.statActive}`}>{activeCount}</span>
            <span className={styles.statLabel}>Aktywnie edytowanych</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>
              {MOCK_DOCUMENTS.reduce((sum, d) => sum + d.editors.length, 0)}
            </span>
            <span className={styles.statLabel}>Aktywnych użytkowników</span>
          </div>
        </div>

        {/* Section title */}
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Twoje dokumenty</h2>
          <div className={styles.filterRow}>
            <button id="filter-all" className={`${styles.filterBtn} ${styles.filterActive}`}>Wszystkie</button>
            <button id="filter-active" className={styles.filterBtn}>Aktywne</button>
            <button id="filter-idle" className={styles.filterBtn}>Nieaktywne</button>
          </div>
        </div>

        {/* Document grid */}
        <div className={styles.documentGrid}>
          {MOCK_DOCUMENTS.map((doc) => (
            <DocumentCard key={doc.id} document={doc} />
          ))}
        </div>
      </main>
    </div>
  );
}
