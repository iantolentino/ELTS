// src/components/ui/SkeletonStatCards.tsx

interface SkeletonStatCardsProps {
  count?: number;
}

export default function SkeletonStatCards({ count = 4 }: SkeletonStatCardsProps) {
  return (
    <>
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
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${count}, 1fr)`, gap: 16, marginBottom: 28 }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "22px 24px", height: 110, position: "relative", overflow: "hidden" }}>
            {/* Top accent bar */}
            <div className="skeleton" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, borderRadius: "16px 16px 0 0" }} />
            {/* Icon placeholder */}
            <div className="skeleton" style={{ position: "absolute", top: 16, right: 16, width: 48, height: 48, borderRadius: 12 }} />
            {/* Label */}
            <div className="skeleton" style={{ height: 8, width: "50%", marginBottom: 12 }} />
            {/* Number */}
            <div className="skeleton" style={{ height: 32, width: "35%", marginBottom: 8, borderRadius: 8 }} />
            {/* Sub */}
            <div className="skeleton" style={{ height: 8, width: "60%" }} />
          </div>
        ))}
      </div>
    </>
  );
}