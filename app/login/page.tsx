import { Metadata } from "next";
import { Suspense } from "react";
import LoginClient from "@/components/LoginClient";

export const metadata: Metadata = {
  title: "Sign In | Julius Silvert B2B",
  description: "Sign in to your Julius Silvert B2B account",
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginClient />
    </Suspense>
  );
}
