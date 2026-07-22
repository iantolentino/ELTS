import Sidebar from "@/components/layout/Sidebar";
import AuthProvider from "@/components/providers/AuthProvider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div style={{
        display:    "flex",
        height:     "100vh",
        background: "var(--background)",
        overflow:   "hidden",
      }}>
        <Sidebar totalTickets={0} />

        <main style={{
          flex:          1,
          display:       "flex",
          flexDirection: "column",
          overflow:      "hidden",
          background:    "var(--background)",
        }}>
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}