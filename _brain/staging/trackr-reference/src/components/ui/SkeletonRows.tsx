// src/components/ui/SkeletonRows.tsx

interface SkeletonRowsProps {
  columns: string;
  rows?:   number;
  cells:   {
    width:   string;
    height?: number;
    shape?:  "bar" | "circle" | "badge" | "double";
    gap?:    boolean;
  }[];
}

export default function SkeletonRows({ columns, rows = 7, cells }: SkeletonRowsProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: columns, padding: "15px 20px", borderBottom: "1px solid var(--border-subtle)", alignItems: "center", opacity: 1 - i * 0.1 }}>
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
    </>
  );
}