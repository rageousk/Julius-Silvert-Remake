import type { Metadata } from "next";
import "./globals.css";
import { ClientShell } from "@/components/ClientShell";
import { SessionProviderWrapper } from "@/components/SessionProviderWrapper";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Julius Silvert B2B Catalog",
  description: "Headless B2B ordering frontend scaffold",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={playfair.variable}>
      <body>
        <div className="app-shell">
          <SessionProviderWrapper>
            <ClientShell>{children}</ClientShell>
          </SessionProviderWrapper>
        </div>
      </body>
    </html>
  );
}
