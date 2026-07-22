import { Badge } from "@/components/ui/badge";
import { PRIORITY_CONFIG, STATUS_CONFIG } from "@/config/constants";
import {
  RiRadioButtonLine,
  RiLoader4Line,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
} from "react-icons/ri";

interface TicketBadgeProps {
  type:  "priority" | "status";
  value: string;
}

const STATUS_COLORS: Record<string, string> = {
  OPEN:        "var(--color-open)",
  IN_PROGRESS: "var(--color-progress)",
  RESOLVED:    "var(--color-resolved)",
  CLOSED:      "var(--color-closed)",
};

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: "var(--color-critical)",
  HIGH:     "var(--color-high)",
  MEDIUM:   "var(--color-medium)",
  LOW:      "var(--color-low)",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  OPEN:        <RiRadioButtonLine    size={11} />,
  IN_PROGRESS: <RiLoader4Line        size={11} />,
  RESOLVED:    <RiCheckboxCircleLine size={11} />,
  CLOSED:      <RiCloseCircleLine    size={11} />,
};

export default function TicketBadge({ type, value }: TicketBadgeProps) {
  const cfg = type === "priority"
    ? PRIORITY_CONFIG[value as keyof typeof PRIORITY_CONFIG]
    : STATUS_CONFIG[value as keyof typeof STATUS_CONFIG];

  if (!cfg) return (
    <span style={{ color: "var(--muted-foreground)", fontSize: 11 }}>{value}</span>
  );

  if (type === "status") {
    const color = STATUS_COLORS[value] ?? "var(--muted-foreground)";
    return (
      <Badge variant="outline" className="gap-1.5 font-normal text-muted-foreground">
        <span style={{ color, display: "flex", alignItems: "center" }}>
          {STATUS_ICONS[value]}
        </span>
        {cfg.label}
      </Badge>
    );
  }

  const color = PRIORITY_COLORS[value] ?? "var(--muted-foreground)";
  return (
    <Badge variant="outline" className="gap-1.5 font-normal text-muted-foreground">
      <span style={{
        width:        8,
        height:       8,
        borderRadius: "50%",
        background:   color,
        display:      "inline-block",
        flexShrink:   0,
      }} />
      {cfg.label}
    </Badge>
  );
}