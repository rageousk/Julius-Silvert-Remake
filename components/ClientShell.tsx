"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { QuickAddBar } from "@/components/QuickAddBar";
import { StoreUserSync } from "@/components/StoreUserSync";

const AUTH_ROUTES = ["/login", "/signup", "/forgot-password", "/reset-password"];

export function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const router    = useRouter();
  const { status } = useSession();

  const isAuthPage = AUTH_ROUTES.some((r) => pathname.startsWith(r));

  // Redirect unauthenticated visitors to /login for every protected page
  useEffect(() => {
    if (!isAuthPage && status === "unauthenticated") {
      router.replace("/login");
    }
  }, [isAuthPage, status, router]);

  // While NextAuth is checking the session, show nothing (avoids flash of content)
  if (!isAuthPage && status === "loading") {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "100vh", background: "#f9f6f1"
      }}>
        <div style={{
          width: 40, height: 40, border: "3px solid #e2d9cc",
          borderTopColor: "#1a3c2e", borderRadius: "50%",
          animation: "spin 0.8s linear infinite"
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Show nothing while redirecting unauthenticated user (avoids flash of site)
  if (!isAuthPage && status === "unauthenticated") {
    return null;
  }

  // Auth pages — render without header/footer
  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <>
      <StoreUserSync />
      <Header />
      <main>{children}</main>
      <Footer />
      <QuickAddBar />
    </>
  );
}
