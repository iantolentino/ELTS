import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  label:  string;
  value:  number;
  sub:    string;
  accent: string;
  icon?:  ReactNode;
}

export default function StatCard({ label, value, sub, accent, icon }: StatCardProps) {
  return (
    <Card>
      <CardContent style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
        {icon && (
          <div style={{
            width:          40,
            height:         40,
            borderRadius:   8,
            background:     `color-mix(in srgb, ${accent} 12%, transparent)`,
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            color:          accent,
            flexShrink:     0,
          }}>
            {icon}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            color:         "var(--muted-foreground)",
            fontSize:      11,
            fontWeight:    500,
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            marginBottom:  4,
          }}>
            {label}
          </div>
          <div style={{
            color:              "var(--foreground)",
            fontSize:           26,
            fontWeight:         700,
            lineHeight:         1,
            marginBottom:       3,
            fontVariantNumeric: "tabular-nums",
          }}>
            {value}
          </div>
          <div style={{ color: "var(--muted-foreground)", fontSize: 11 }}>
            {sub}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}