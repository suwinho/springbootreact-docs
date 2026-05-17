import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  cookies: {
    sessionToken: {
      name: "next-auth.session-token.docs-app",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false
      }
    }
  },
  providers: [
    Keycloak({
      clientId: process.env.KEYCLOAK_CLIENT_ID ?? "docs-app",
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET ?? "",
      issuer: process.env.KEYCLOAK_ISSUER ?? "http://localhost:8080/realms/docs",
      wellKnown: `${process.env.KEYCLOAK_INTERNAL_ISSUER ?? "http://localhost:8080/realms/docs"}/.well-known/openid-configuration`,
      authorization: {
        url: `${process.env.KEYCLOAK_PUBLIC_ISSUER ?? "http://localhost:8080"}/realms/docs/protocol/openid-connect/auth`,
        params: { scope: "openid email profile" }
      },
      token: `${process.env.KEYCLOAK_INTERNAL_ISSUER ?? "http://localhost:8080/realms/docs"}/protocol/openid-connect/token`,
      userinfo: `${process.env.KEYCLOAK_INTERNAL_ISSUER ?? "http://localhost:8080/realms/docs"}/protocol/openid-connect/userinfo`,
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
