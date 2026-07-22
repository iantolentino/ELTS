"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/utils/ticket";
import { RiArrowDownSLine, RiLogoutBoxLine, RiUserLine } from "react-icons/ri";

type PortalUser = {
  name?: string | null;
  email?: string | null;
  role?: string | null;
};

export default function PortalAccountMenu({ user }: { user: PortalUser }) {
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    await signOut({ callbackUrl: "/auth/login", redirect: true });
  };

  const role = user.role ? user.role.charAt(0) + user.role.slice(1).toLowerCase() : "Requester";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            title="Account menu"
            aria-label="Account menu"
            style={{ width: 42, padding: 0, gap: 2, fontFamily: "inherit" }}
          >
            <Avatar style={{ width: 24, height: 24 }}>
              <AvatarFallback style={{ fontSize: 10, fontWeight: 600, background: "var(--muted)", color: "var(--foreground)" }}>
                {getInitials(user.name ?? user.email ?? "?")}
              </AvatarFallback>
            </Avatar>
            <RiArrowDownSLine size={13} style={{ color: "var(--muted-foreground)" }} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" style={{ minWidth: 220, fontFamily: "inherit" }}>
          <DropdownMenuLabel style={{ fontSize: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <RiUserLine size={14} style={{ color: "var(--muted-foreground)" }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.name ?? "Account"}
                </div>
                <div style={{ color: "var(--muted-foreground)", fontSize: 11, fontWeight: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.email ?? ""}
                </div>
              </div>
            </div>
            <div style={{ color: "var(--muted-foreground)", fontSize: 11, fontWeight: 400, marginTop: 8 }}>
              Role: {role}
            </div>
          </DropdownMenuLabel>
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

      {confirmSignOut && (
        <ConfirmModal
          title="Sign Out"
          message="Are you sure you want to sign out?"
          confirmLabel="Sign out"
          variant="warning"
          loading={isSigningOut}
          onConfirm={handleSignOut}
          onCancel={() => setConfirmSignOut(false)}
        />
      )}
    </>
  );
}
