import { Suspense } from "react";
import { ForgotPasswordClient } from "@/components/ForgotPasswordClient";

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="login-page" style={{ minHeight: "60vh" }} />}>
      <ForgotPasswordClient />
    </Suspense>
  );
}
