import { Suspense } from "react";
import { ResetPasswordClient } from "@/components/ResetPasswordClient";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="login-page" style={{ minHeight: "60vh" }} />}>
      <ResetPasswordClient />
    </Suspense>
  );
}
