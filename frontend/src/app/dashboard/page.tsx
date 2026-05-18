'use client';

import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import useSWR, { mutate } from 'swr';
import DocumentCard from '@/components/DocumentCard';
import styles from './dashboard.module.css';

const fetcher = async (url: string, token?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error('Failed to fetch data');
  return res.json();
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const accessToken = (session as any)?.accessToken;

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'idle'>('all');
  
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareDocId, setShareDocId] = useState<string | null>(null);
  const [shareEmail, setShareEmail] = useState('');
  const [shareLoading, setShareLoading] = useState(false);

  const { data: rawDocuments, error, isLoading } = useSWR(
    accessToken ? ['/api/documents', accessToken] : null,
    ([url, token]) => fetcher(url, token)
  );

  const documents = (Array.isArray(rawDocuments)
    ? rawDocuments
    : (rawDocuments && Array.isArray((rawDocuments as any).content) ? (rawDocuments as any).content : [])
  ).map((doc: any) => ({
    id: doc.id,
    title: doc.title || 'Untitled',
    lastModified: doc.updatedAt || doc.createdAt || new Date().toISOString(),
    editors: doc.editors || [],
    size: doc.size || '0 KB',
    status: doc.status || 'idle',
    ownerUsername: doc.owner?.username || doc.ownerUsername || 'Unknown',
  }));

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading' || (isLoading && !documents.length)) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner} />
        <p>Loading...</p>
      </div>
    );
  }

  const userName = session?.user?.name ?? session?.user?.email ?? 'User';
  const userInitials = userName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const activeCount = documents.filter((d: any) => d.status === 'active').length;

  const filteredDocs = documents.filter((doc: any) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || doc.status === filter;
    return matchesSearch && matchesFilter;
  });

  const handleCreateDocument = async () => {
    const newDoc = {
      id: Date.now().toString(),
      title: 'New Document',
      lastModified: new Date().toISOString(),
      editors: [],
      size: '0 KB',
      status: 'idle',
    };

    mutate(['/api/documents', accessToken], [newDoc, ...documents], false);

    try {
      await fetch('/api/documents', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({ title: 'New Document' }),
      });
      mutate(['/api/documents', accessToken]);
    } catch (e) {
      mutate(['/api/documents', accessToken]);
    }
  };

  const handleShareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareDocId || !shareEmail) return;
    
    setShareLoading(true);
    try {
      const res = await fetch(`/api/documents/${shareDocId}/share`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({ email: shareEmail, role: 'EDITOR' }),
      });
      if (!res.ok) {
        if (res.status === 400) {
          throw new Error('User not found with this email (the user must log in at least once to be registered in the database).');
        } else {
          throw new Error('Server returned an error while sharing.');
        }
      }
      alert(`Document shared with: ${shareEmail}`);
      setShareModalOpen(false);
      setShareEmail('');
    } catch (err: any) {
      alert(err.message || 'Error while sharing.');
    } finally {
      setShareLoading(false);
    }
  };

  const openShareModal = (id: string) => {
    setShareDocId(id);
    setShareModalOpen(true);
  };

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
            Dashboard
          </a>
          <a href="#" id="nav-documents" className={styles.navItem}>My Documents</a>
          <a href="#" id="nav-shared" className={styles.navItem}>Shared</a>
          <a href="#" id="nav-recent" className={styles.navItem}>Recent</a>
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
            title="Log out"
          >
            Log out
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.headerTitle}>Dashboard</h1>
            <p className={styles.headerSubtitle}>Manage your documents</p>
          </div>
          <button id="new-doc-btn" className={styles.newDocBtn} onClick={handleCreateDocument}>
            New document
          </button>
        </header>

        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{documents.length}</span>
            <span className={styles.statLabel}>Total documents</span>
          </div>
          <div className={styles.statCard}>
            <span className={`${styles.statValue} ${styles.statActive}`}>{activeCount}</span>
            <span className={styles.statLabel}>Actively edited</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>
              {documents.reduce((sum: number, d: any) => sum + (d.editors?.length || 0), 0)}
            </span>
            <span className={styles.statLabel}>Active users</span>
          </div>
        </div>

        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Your documents</h2>
          
          <div className={styles.controlsRow}>
            <input 
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            <div className={styles.filterRow}>
              <button 
                id="filter-all" 
                className={`${styles.filterBtn} ${filter === 'all' ? styles.filterActive : ''}`}
                onClick={() => setFilter('all')}
              >All</button>
              <button 
                id="filter-active" 
                className={`${styles.filterBtn} ${filter === 'active' ? styles.filterActive : ''}`}
                onClick={() => setFilter('active')}
              >Active</button>
              <button 
                id="filter-idle" 
                className={`${styles.filterBtn} ${filter === 'idle' ? styles.filterActive : ''}`}
                onClick={() => setFilter('idle')}
              >Inactive</button>
            </div>
          </div>
        </div>

        {error && <div className={styles.errorText}>An error occurred while fetching documents.</div>}

        <div className={styles.documentGrid}>
          {filteredDocs.map((doc: any) => (
            <div key={doc.id} className={styles.cardWrapper}>
              <DocumentCard document={doc} token={accessToken} onRenamed={() => mutate(['/api/documents', accessToken])} />
              <button 
                onClick={() => openShareModal(doc.id)}
                className={styles.shareBtn}
              >
                Share
              </button>
            </div>
          ))}
          {filteredDocs.length === 0 && <p>No documents matching the criteria.</p>}
        </div>
      </main>

      {shareModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>Share Document</h3>
            <form onSubmit={handleShareSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>User email</label>
                <input 
                  type="email" 
                  required
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  className={styles.formInput}
                />
              </div>
              <div className={styles.formActions}>
                <button 
                  type="button" 
                  onClick={() => setShareModalOpen(false)}
                  className={styles.cancelBtn}
                >Cancel</button>
                <button 
                  type="submit" 
                  disabled={shareLoading}
                  className={styles.submitBtn}
                >{shareLoading ? 'Sending...' : 'Share'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
