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

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins !== 1 ? "s" : ""} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

export default function RecentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const accessToken = (session as any)?.accessToken;
  const [searchQuery, setSearchQuery] = useState("");

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

  const documents = [...allDocuments].sort(
    (a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime(),
  );

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

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.headerTitle}>Recent</h1>
          <p className={styles.headerSubtitle}>Recently modified documents</p>
        </div>
      </header>

      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>
          {documents.length} document{documents.length !== 1 ? "s" : ""}
        </h2>
        <div className={styles.controlsRow}>
          <input
            type="text"
            placeholder="Search recent documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {error && <div className={styles.errorText}>An error occurred while fetching documents.</div>}

      <div className={styles.recentList}>
        {filteredDocs.map((doc: any) => (
          <div key={doc.id} className={styles.recentItem}>
            <div className={styles.recentItemInfo}>
              <span className={styles.recentItemTitle}>{doc.title}</span>
              <span className={styles.recentItemMeta}>
                {doc.myRole === "OWNER" ? "You" : `Shared by ${doc.ownerUsername}`}
                {" · "}
                <span className={styles.recentItemTime}>{timeAgo(doc.lastModified)}</span>
              </span>
            </div>
            <span className={styles.recentItemRole}>{doc.myRole}</span>
            <DocumentCard
              document={doc}
              token={accessToken}
              onRenamed={() => mutate(["/api/documents", accessToken])}
              onDeleted={() => mutate(["/api/documents", accessToken])}
            />
          </div>
        ))}
        {filteredDocs.length === 0 && (
          <p>No recent documents found.</p>
        )}
      </div>
    </main>
  );
}
