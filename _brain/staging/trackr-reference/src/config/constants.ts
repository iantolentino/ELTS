// src/config/constants.ts

export const APP_NAME = "Trackr";

export const PRIORITY_CONFIG = {
  CRITICAL: { label: "Critical", color: "#FF3B30", bg: "rgba(255,59,48,0.12)" },
  HIGH:     { label: "High",     color: "#FF9500", bg: "rgba(255,149,0,0.12)"  },
  MEDIUM:   { label: "Medium",   color: "#007AFF", bg: "rgba(0,122,255,0.12)"  },
  LOW:      { label: "Low",      color: "#34C759", bg: "rgba(52,199,89,0.12)"  },
} as const;

export const STATUS_CONFIG = {
  OPEN:        { label: "Open",        color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  IN_PROGRESS: { label: "In Progress", color: "#38bdf8", bg: "rgba(56,189,248,0.12)"  },
  RESOLVED:    { label: "Resolved",    color: "#34C759", bg: "rgba(52,199,89,0.12)"   },
  CLOSED:      { label: "Closed",      color: "#888",    bg: "rgba(136,136,136,0.12)" },
} as const;

export const NAV_ITEMS = [
  { id: "dashboard", icon: "⬡", label: "Dashboard", href: "/dashboard" },
  { id: "tickets",   icon: "◈", label: "Tickets",   href: "/tickets"   },
  { id: "team",      icon: "◎", label: "Team",      href: "/team"      },
  { id: "reports",   icon: "▦", label: "Reports",   href: "/reports"   },
  { id: "settings",  icon: "⊙", label: "Settings",  href: "/settings"  },
] as const;
