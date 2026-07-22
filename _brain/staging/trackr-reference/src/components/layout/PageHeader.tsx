import { ReactNode } from "react";

interface PageHeaderProps {
  title:     string;
  subtitle?: string;
  actions?:  ReactNode;
}

export default function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <header style={{
      borderBottom:   "1px solid var(--border)",
      padding:        "14.5px 24px",
      flexShrink:     0,
      background:     "var(--background)",
      display:        "flex",
      alignItems:     "center",
      justifyContent: "space-between",
    }}>
      <div>
        <h1 style={{
          fontWeight:    600,
          fontSize:      18,
          color:         "var(--foreground)",
          letterSpacing: "-0.02em",
        }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{
            color:     "var(--muted-foreground)",
            fontSize:  12,
            marginTop: 2,
          }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {actions}
        </div>
      )}
    </header>
  );
}