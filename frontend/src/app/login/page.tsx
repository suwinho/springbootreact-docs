'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import styles from './login.module.css';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    await signIn('keycloak', { callbackUrl: '/dashboard' });
  };

  return (
    <div className={styles.container}>
      <div className={styles.blob1} />
      <div className={styles.blob2} />
      <div className={styles.blob3} />

      <div className={styles.card}>
        <div className={styles.brand}>
          <div className={styles.logoIcon}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="10" fill="url(#brandGrad)" />
              <path d="M9 10h14M9 16h10M9 22h12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="24" cy="22" r="4" fill="white" fillOpacity="0.9" />
              <path d="M22.5 22L23.5 23L25.5 21" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <defs>
                <linearGradient id="brandGrad" x1="0" y1="0" x2="32" y2="32">
                  <stop stopColor="#6366f1" />
                  <stop offset="1" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className={styles.brandName}>DocCollab</h1>
          <p className={styles.brandTagline}>Collaborative editing, reimagined</p>
        </div>

        <div className={styles.divider}>
          <span>Zaloguj się, aby kontynuować</span>
        </div>

        <ul className={styles.features}>
          {[
            { icon: '✦', text: 'Edycja dokumentów w czasie rzeczywistym' },
            { icon: '✦', text: 'Współpraca z wieloma użytkownikami naraz' },
            { icon: '✦', text: 'Bezpieczne uwierzytelnianie przez Keycloak' },
          ].map((f) => (
            <li key={f.text} className={styles.featureItem}>
              <span className={styles.featureIcon}>{f.icon}</span>
              <span>{f.text}</span>
            </li>
          ))}
        </ul>

        <button
          id="keycloak-login-btn"
          className={styles.loginButton}
          onClick={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className={styles.spinner} />
          ) : (
            <svg className={styles.keycloakIcon} viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {isLoading ? 'Przekierowanie...' : 'Zaloguj przez Keycloak'}
        </button>

        <p className={styles.footer}>
          Uwierzytelnione przez{' '}
          <span className={styles.footerAccent}>Keycloak SSO</span>
        </p>
      </div>
    </div>
  );
}
