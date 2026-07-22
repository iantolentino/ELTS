"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { NAV_ITEMS } from "@/config/constants";
import { signOut, useSession } from "next-auth/react";
import { getInitials } from "@/utils/ticket";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useTheme } from "next-themes";
import { useAbac } from "@/hooks/useAbac";
import {
  RiDashboardLine, RiTicketLine, RiTeamLine,
  RiBarChartLine,  RiSettingsLine, RiLogoutBoxLine,
  RiSunLine, RiMoonLine,RiMoreLine, RiInformationLine,
  RiCustomerService2Line
} from "react-icons/ri";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { TbDotsVertical } from "react-icons/tb";



const NAV_ICONS: Record<string, React.ReactNode> = {
  dashboard: <RiDashboardLine size={18} />,
  tickets:   <RiTicketLine    size={18} />,
  team:      <RiTeamLine      size={18} />,
  reports:   <RiBarChartLine  size={18} />,
  settings:  <RiSettingsLine  size={18} />,
};

export default function Sidebar({ totalTickets }: { totalTickets: number }) {
  const { user } = useAbac();
  const pathname = usePathname();
  const router   = useRouter();
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const isDark = theme === "dark";

  const handleLogout = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    await signOut({ callbackUrl: "/auth/login", redirect: true });
  };

  return (
    <aside style={{
      width:         260,
      background:    "var(--sidebar-bg)",
      borderRight:   "1px solid var(--border)",
      display:       "flex",
      flexDirection: "column",
      flexShrink:    0,
    }}>

      {/* Logo */}
      <div style={{
        padding:      "24px 20px 20px",
        borderBottom: "1px solid var(--border)",
        display:      "flex",
        alignItems:   "center",
        gap:          10,
      }}>
        <div style={{
          width:          32,
          height:         32,
          borderRadius:   8,
          background:     "var(--foreground)",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          flexShrink:     0,
        }}>
          <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="1" width="5" height="5" rx="1" fill="var(--background)" />
            <rect x="8" y="1" width="5" height="5" rx="1" fill="var(--background)" />
            <rect x="1" y="8" width="5" height="5" rx="1" fill="var(--background)" />
            <rect x="8" y="8" width="5" height="5" rx="1" fill="var(--background)" opacity="0.4" />
          </svg>
        </div>
        <span style={{
          fontWeight:    700,
          fontSize:      17,
          color:         "var(--foreground)",
          letterSpacing: "-0.02em",
        }}>
          Trackr
        </span>
      </div>

      {/* Nav */}
      <nav style={{
  flex:          1,
  padding:       "12px 12px",
  display:       "flex",
  flexDirection: "column",
  gap:           4,
  overflowY:     "auto",
}}>
  {NAV_ITEMS
    .filter((item) => {
      if (user.role === "REQUESTER") {
        return false;
      }
      if (user.role === "MEMBER") {
        return ["dashboard", "tickets"].includes(item.id);
      }
      if (user.role === "MANAGER") {
        return ["dashboard", "tickets", "team", "reports"].includes(item.id);
      }
      return true;
    })
    .map((item) => {
      const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
      return (
        <Button
          key={item.id}
          variant={isActive ? "secondary" : "ghost"}
          size="sm"
          onClick={() => router.push(item.href)}
          style={{
            width:          "100%",
            justifyContent: "flex-start",
            gap:            12,
            fontSize:       14,
            fontWeight:     isActive ? 500 : 400,
            color:          isActive ? "var(--foreground)" : "var(--muted-foreground)",
            fontFamily:     "inherit",
            height:         42,
            paddingLeft:    12,
            paddingRight:   12,
          }}
        >
          <span style={{ opacity: isActive ? 1 : 0.6, display: "flex", alignItems: "center" }}>
            {NAV_ICONS[item.id]}
          </span>
          <span style={{ flex: 1, textAlign: "left" }}>{item.label}</span>
          {item.id === "tickets" && totalTickets > 0 && (
            <span style={{
              background:         "var(--muted)",
              color:              "var(--muted-foreground)",
              fontSize:           11,
              fontWeight:         500,
              borderRadius:       4,
              padding:            "1px 7px",
              fontVariantNumeric: "tabular-nums",
            }}>
              {totalTickets}
            </span>
          )}
        </Button>
      );
    })}
      </nav>

      {/* Bottom */}
      <div style={{
        padding:   "12px 12px 20px",
        borderTop: "1px solid var(--border)",
        display:   "flex",
        flexDirection: "column",
        gap:       4,
      }}>
        {["ADMIN", "MANAGER", "MEMBER"].includes(user.role) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/portal")}
            style={{
              width:          "100%",
              justifyContent: "flex-start",
              gap:            12,
              fontSize:       14,
              fontWeight:     400,
              color:          "var(--muted-foreground)",
              fontFamily:     "inherit",
              height:         42,
              paddingLeft:    12,
              paddingRight:   12,
            }}
          >
            <span style={{ display: "flex", alignItems: "center", opacity: 0.6 }}>
              <RiCustomerService2Line size={18} />
            </span>
            Submit request
          </Button>
        )}

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          style={{
            width:          "100%",
            justifyContent: "flex-start",
            gap:            12,
            fontSize:       14,
            fontWeight:     400,
            color:          "var(--muted-foreground)",
            fontFamily:     "inherit",
            height:         42,
            paddingLeft:    12,
            paddingRight:   12,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", opacity: 0.6 }}>
            {isDark ? <RiSunLine size={18} /> : <RiMoonLine size={18} />}
          </span>
          {isDark ? "Light mode" : "Dark mode"}
        </Button>

        {/* User row */}
        <div style={{
          display:      "flex",
          alignItems:   "center",
          gap:          10,
          padding:      "6px 10px",
          borderRadius: 8,
        }}>
          <Avatar style={{ width: 32, height: 32, flexShrink: 0 }}>
            <AvatarFallback style={{
              fontSize:   11,
              fontWeight: 600,
              background: "var(--muted)",
              color:      "var(--foreground)",
            }}>
              {getInitials(session?.user?.name ?? "?")}
            </AvatarFallback>
          </Avatar>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              color:        "var(--foreground)",
              fontSize:     13,
              fontWeight:   500,
              overflow:     "hidden",
              textOverflow: "ellipsis",
              whiteSpace:   "nowrap",
            }}>
              {session?.user?.name ?? "User"}
            </div>
            <div style={{
              color:        "var(--muted-foreground)",
              fontSize:     11,
              overflow:     "hidden",
              textOverflow: "ellipsis",
              whiteSpace:   "nowrap",
            }}>
              {session?.user?.email ?? ""}
            </div>
          </div>

          {/* 3 dots menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                style={{
                  width:     28,
                  height:    28,
                  flexShrink: 0,
                  color:     "var(--muted-foreground)",
                }}
              >
                <TbDotsVertical  size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              side="top"
              style={{ minWidth: 180, fontFamily: "inherit" }}
            >
              <DropdownMenuLabel style={{ fontSize: 12 }}>
                <div style={{ fontWeight: 500 }}>{session?.user?.name ?? "User"}</div>
                <div style={{ color: "var(--muted-foreground)", fontSize: 11, fontWeight: 400 }}>
                  {session?.user?.email ?? ""}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                style={{ fontSize: 13, gap: 8, cursor: "pointer" }}
                onClick={() => window.open("https://github.com/James-push/ticketing-system", "_blank")}
              >
                <RiInformationLine size={14} style={{ opacity: 0.6 }} />
                Learn more
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setConfirmSignOut(true)}
                disabled={isSigningOut}
                style={{ fontSize: 13, gap: 8, cursor: isSigningOut ? "default" : "pointer", color: "var(--color-danger)" }}
              >
                <RiLogoutBoxLine size={14} />
                {isSigningOut ? "Signing out..." : "Sign out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {confirmSignOut && (
        <ConfirmModal
          title="Sign Out"
          message="Are you sure you want to sign out?"
          confirmLabel="Sign out"
          variant="warning"
          loading={isSigningOut}
          onConfirm={handleLogout}
          onCancel={() => setConfirmSignOut(false)}
        />
      )}
    </aside>
  );
}
