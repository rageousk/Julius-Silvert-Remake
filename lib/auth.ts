import { NextAuthOptions } from "next-auth";
import GoogleProvider      from "next-auth/providers/google";
import AzureADProvider     from "next-auth/providers/azure-ad";
import CredentialsProvider from "next-auth/providers/credentials";
import { isDomainAllowed } from "@/lib/auth-domains";
import { normalizeAccountEmail } from "@/lib/account-email";
import { hasPasswordSet, verifyCredentialLogin } from "@/lib/credential-store.server";
import { getDevAuthBootId } from "@/lib/dev-auth-boot";

/**
 * Build the providers list dynamically — only include SSO providers whose
 * credentials are actually configured in .env.local so the app doesn't
 * crash in prototype mode without OAuth keys.
 */
function buildProviders() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const providers: any[] = [];

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(
      GoogleProvider({
        clientId:     process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        authorization: {
          params: {
            // Force account picker every time
            prompt: "select_account",
          },
        },
      })
    );
  }

  if (process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET) {
    providers.push(
      AzureADProvider({
        clientId:     process.env.AZURE_AD_CLIENT_ID,
        clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
        // Use "common" to allow any Microsoft account, or set your tenant ID
        tenantId: process.env.AZURE_AD_TENANT_ID ?? "common",
      })
    );
  }

  // Credentials provider — requires a valid allowed-domain email
  providers.push(
    CredentialsProvider({
      id:   "credentials",
      name: "Email & Password",
      credentials: {
        email:    { label: "Email",    type: "text"     },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Enforce domain restriction — same rule as SSO
        if (!isDomainAllowed(credentials.email)) return null;

        const email = normalizeAccountEmail(credentials.email);
        if (!email) return null;
        if (!hasPasswordSet(email)) return null;
        if (!verifyCredentialLogin(email, credentials.password)) return null;

        return {
          id:    email,
          email,
          name:  email.split("@")[0],
        };
      },
    })
  );

  return providers;
}

export const authOptions: NextAuthOptions = {
  // Required on Vercel so the host/URL is trusted and sessions resolve (avoids stuck loading).
  trustHost: true,
  providers: buildProviders(),

  pages: {
    signIn:  "/login",
    signOut: "/login",
    error:   "/login",
  },

  session: {
    strategy: "jwt",
    maxAge:   7 * 24 * 60 * 60, // 7 days
  },

  callbacks: {
    /**
     * signIn callback — runs before the session is created.
     * Return true  → allow sign-in.
     * Return false → block sign-in (redirects to /login?error=AccessDenied).
     */
    async signIn({ user, account }) {
      const email = normalizeAccountEmail(user?.email);

      // Credentials provider: domain check is handled inside authorize()
      if (account?.provider === "credentials") return true;

      // For Google / Microsoft SSO — enforce allowed domains
      if (!isDomainAllowed(email)) {
        return false; // NextAuth will redirect to /login?error=AccessDenied
      }

      return true;
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, user, account, trigger, session: updateData }: any) {
      const devBootId = getDevAuthBootId();
      if (devBootId) {
        if (user) {
          token.devBootId = devBootId;
        } else if (token.devBootId !== devBootId) {
          // Cookie from an older dev server — force sign-out
          return {};
        }
      }

      // Initial sign-in — canonical email so Google vs Microsoft vs credentials match one user
      if (user) {
        const u = user as { email?: string | null; preferred_username?: string | null };
        const raw = u.email || u.preferred_username || "";
        token.email = normalizeAccountEmail(raw) || "";
        token.name  = user.name;
      }
      if (account) { token.provider = account.provider; }

      // Called when client calls update({ name: "..." }) from useSession()
      if (trigger === "update" && updateData?.name) {
        token.name = updateData.name;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.email = normalizeAccountEmail(token.email as string) || (token.email as string) || "";
        session.user.name  = (token.name as string) ?? null;
        // @ts-expect-error — extend session type if needed
        session.user.provider = token.provider;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET ?? "julius-silvert-dev-secret-change-in-production",
};
