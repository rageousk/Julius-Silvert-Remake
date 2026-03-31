"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

/**
 * Returns a guard() wrapper that runs the given action only if the user has
 * an active NextAuth session. If not, redirects to /login.
 */
export function useAuthGuard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated" && !!session?.user;

  function guard<T extends unknown[]>(action: (...args: T) => void) {
    return (...args: T) => {
      if (!isLoggedIn) {
        router.push("/login");
        return;
      }
      action(...args);
    };
  }

  return { guard, isLoggedIn };
}
