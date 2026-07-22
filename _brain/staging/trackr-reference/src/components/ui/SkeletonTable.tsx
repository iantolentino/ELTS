// src/components/ui/SkeletonTable.tsx

interface SkeletonTableProps {
  columns:  string;   // grid-template-columns value
  rows?:    number;     // number of skeleton rows (default 7)
  cells:    {           // describes each cell in a row
    width:    string;
    height?:  number;
    shape?:   "bar" | "circle" | "badge" | "double";  // double = title + subtitle
    gap?:     boolean;  // wraps in flex row (e.g. avatar + name)
  }[];
}

export default function SkeletonTable({ columns, rows = 7, cells }: SkeletonTableProps) {
  return (
    <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -600px 0; }
          100% { background-position:  600px 0; }
        }
        .skeleton {
          background: linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-hover) 50%, var(--bg-elevated) 75%);
          background-size: 600px 100%;
          animation: shimmer 1.4s infinite linear;
          border-radius: 6px;
        }
      `}</style>

      {/* Header */}
      <div style={{ display: "grid", gridTemplateColumns: columns, padding: "12px 20px", borderBottom: "1px solid var(--border)" }}>
        {cells.map((cell, i) => (
          <div key={i} className="skeleton" style={{ height: 10, width: cell.width, borderRadius: 6 }} />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: columns, padding: "15px 20px", borderBottom: "1px solid var(--border-subtle)", alignItems: "center" }}>
          {cells.map((cell, j) => {
            if (cell.shape === "double") return (
              <div key={j}>
                <div className="skeleton" style={{ height: cell.height ?? 10, width: cell.width, marginBottom: 8, borderRadius: 6 }} />
                <div className="skeleton" style={{ height: 8, width: "60%", borderRadius: 6 }} />
              </div>
            );

            if (cell.shape === "circle") return (
              <div key={j} className="skeleton" style={{ height: cell.height ?? 26, width: cell.width, borderRadius: "50%", flexShrink: 0 }} />
            );

            if (cell.shape === "badge") return (
              <div key={j} className="skeleton" style={{ height: cell.height ?? 22, width: cell.width, borderRadius: 999 }} />
            );

            if (cell.gap) return (
              <div key={j} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div className="skeleton" style={{ height: 26, width: 26, borderRadius: "50%", flexShrink: 0 }} />
                <div className="skeleton" style={{ height: 10, width: cell.width, borderRadius: 6 }} />
              </div>
            );

            return (
              <div key={j} className="skeleton" style={{ height: cell.height ?? 10, width: cell.width, borderRadius: 6 }} />
            );
          })}
        </div>
      ))}
    </div>
  );
}