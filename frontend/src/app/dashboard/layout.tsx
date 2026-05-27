"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./dashboard.module.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const userName = session?.user?.name ?? session?.user?.email ?? "User";
  const userInitials = userName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const navItems = [
    { href: "/dashboard", label: "Dashboard", id: "nav-dashboard" },
    { href: "/dashboard/my-documents", label: "My Documents", id: "nav-documents" },
    { href: "/dashboard/shared", label: "Shared", id: "nav-shared" },
    { href: "/dashboard/recent", label: "Recent", id: "nav-recent" },
  ];

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="10" fill="url(#sideGrad)" />
            <path
              d="M9 10h14M9 16h10M9 22h12"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
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
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                id={item.id}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
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
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Log out"
          >
            Log out
          </button>
        </div>
      </aside>

      {children}
    </div>
  );
}
