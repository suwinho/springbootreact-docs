"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import useSWR, { mutate } from "swr";
import DocumentCard from "@/components/DocumentCard";
import styles from "../dashboard.module.css";

const fetcher = async (url: string, token?: string) => {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error("Failed to fetch data");
  return res.json();
};

export default function MyDocumentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const accessToken = (session as any)?.accessToken;
  const [searchQuery, setSearchQuery] = useState("");

  const [shareRole, setShareRole] = useState<"EDITOR" | "VIEWER">("VIEWER");
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareDocId, setShareDocId] = useState<string | null>(null);
  const [shareEmail, setShareEmail] = useState("");
  const [shareLoading, setShareLoading] = useState(false);

  const { data: rawDocuments, error, isLoading } = useSWR(
    accessToken ? ["/api/documents", accessToken] : null,
    ([url, token]) => fetcher(url, token),
  );

  const allDocuments = (
    Array.isArray(rawDocuments)
      ? rawDocuments
      : rawDocuments && Array.isArray((rawDocuments as any).content)
        ? (rawDocuments as any).content
        : []
  ).map((doc: any) => ({
    id: doc.id,
    title: doc.title || "Untitled",
    lastModified: doc.updatedAt || doc.createdAt || new Date().toISOString(),
    editors: doc.editors || [],
    size: doc.size || "0 KB",
    ownerUsername: doc.owner?.username || doc.ownerUsername || "Unknown",
    myRole: doc.myRole,
  }));

  const documents = allDocuments.filter((doc: any) => doc.myRole === "OWNER");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  if (status === "loading" || (isLoading && !allDocuments.length)) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner} />
        <p>Loading...</p>
      </div>
    );
  }

  const filteredDocs = documents.filter((doc: any) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCreateDocument = async () => {
    try {
      await fetch("/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ title: "New Document" }),
      });
      mutate(["/api/documents", accessToken]);
    } catch (e) {
      mutate(["/api/documents", accessToken]);
    }
  };

  const handleShareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareDocId || !shareEmail) return;
    setShareLoading(true);
    try {
      const res = await fetch(`/api/documents/${shareDocId}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ email: shareEmail, role: shareRole }),
      });
      if (!res.ok) {
        if (res.status === 400) throw new Error("User not found with this email.");
        throw new Error("Server returned an error while sharing.");
      }
      alert(`Document shared with: ${shareEmail}`);
      setShareModalOpen(false);
      setShareEmail("");
    } catch (err: any) {
      alert(err.message || "Error while sharing.");
    } finally {
      setShareLoading(false);
    }
  };

  return (
    <>
      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.headerTitle}>My Documents</h1>
            <p className={styles.headerSubtitle}>Documents you own and created</p>
          </div>
          <button id="new-doc-btn" className={styles.newDocBtn} onClick={handleCreateDocument}>
            New document
          </button>
        </header>

        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            {documents.length} document{documents.length !== 1 ? "s" : ""}
          </h2>
          <div className={styles.controlsRow}>
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        {error && <div className={styles.errorText}>An error occurred while fetching documents.</div>}

        <div className={styles.documentGrid}>
          {filteredDocs.map((doc: any) => (
            <div key={doc.id} className={styles.cardWrapper}>
              <DocumentCard
                document={doc}
                token={accessToken}
                onRenamed={() => mutate(["/api/documents", accessToken])}
                onDeleted={() => mutate(["/api/documents", accessToken])}
              />
              <button
                onClick={() => { setShareDocId(doc.id); setShareModalOpen(true); }}
                className={styles.shareBtn}
              >
                Share
              </button>
            </div>
          ))}
          {filteredDocs.length === 0 && (
            <p>No documents found. Create your first document!</p>
          )}
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
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Role</label>
                <select
                  value={shareRole}
                  onChange={(e) => setShareRole(e.target.value as "EDITOR" | "VIEWER")}
                  className={styles.formInput}
                >
                  <option value="VIEWER">Viewer (read only)</option>
                  <option value="EDITOR">Editor (can edit)</option>
                </select>
              </div>
              <div className={styles.formActions}>
                <button type="button" onClick={() => setShareModalOpen(false)} className={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" disabled={shareLoading} className={styles.submitBtn}>
                  {shareLoading ? "Sending..." : "Share"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
