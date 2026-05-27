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

export default function SharedPage() {
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

  const documents = allDocuments.filter((doc: any) => doc.myRole !== "OWNER");

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
          <h1 className={styles.headerTitle}>Shared with me</h1>
          <p className={styles.headerSubtitle}>Documents other users have shared with you</p>
        </div>
      </header>

      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>
          {documents.length} shared document{documents.length !== 1 ? "s" : ""}
        </h2>
        <div className={styles.controlsRow}>
          <input
            type="text"
            placeholder="Search shared documents..."
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
          </div>
        ))}
        {filteredDocs.length === 0 && (
          <p>No shared documents found. Ask someone to share a document with you!</p>
        )}
      </div>
    </main>
  );
}
