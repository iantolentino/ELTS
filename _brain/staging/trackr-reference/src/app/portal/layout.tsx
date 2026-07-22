import type { Metadata } from "next";
import SessionProvider from "@/components/providers/SessionProvider";

export const metadata: Metadata = {
  title:       "Trackr Portal — Submit a Request",
  description: "Browse departments and submit support requests",
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div style={{ minHeight: "100vh", background: "var(--background)" }}>
        {children}
      </div>
    </SessionProvider>
  );
}