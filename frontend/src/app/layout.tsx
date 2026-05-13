import { auth } from '@/lib/auth';
import AuthProvider from '@/components/AuthProvider';
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DocCollab — Collaborative Word Editor',
  description: 'Real-time collaborative document editing platform with Keycloak authentication',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="pl">
      <body>
        <AuthProvider session={session}>{children}</AuthProvider>
      </body>
    </html>
  );
}
