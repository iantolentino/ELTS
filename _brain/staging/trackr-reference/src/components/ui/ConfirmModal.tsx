"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogMedia,
} from "@/components/ui/alert-dialog";
import { Trash2Icon, AlertTriangleIcon, InfoIcon } from "lucide-react";

interface ConfirmModalProps {
  title:         string;
  message:       string;
  confirmLabel?: string;
  cancelLabel?:  string;
  variant?:      "danger" | "warning" | "info";
  onConfirm:     () => void;
  onCancel:      () => void;
  loading?:      boolean;
}

const VARIANT_CONFIG = {
  danger: {
    mediaClass:    "bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive",
    icon:          <Trash2Icon size={18} />,
    actionVariant: "destructive" as const,
    actionStyle:   {},
  },
  warning: {
    mediaClass:    "bg-orange-500/10 text-orange-500 dark:bg-orange-500/20 dark:text-orange-400",
    icon:          <AlertTriangleIcon size={18} />,
    actionVariant: "outline" as const,
    actionStyle:   { color: "var(--color-high)", borderColor: "var(--color-high)" },
  },
  info: {
    mediaClass:    "bg-blue-500/10 text-blue-500 dark:bg-blue-500/20 dark:text-blue-400",
    icon:          <InfoIcon size={18} />,
    actionVariant: "default" as const,
    actionStyle:   {},
  },
};

export default function ConfirmModal({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel  = "Cancel",
  variant      = "danger",
  onConfirm,
  onCancel,
  loading      = false,
}: ConfirmModalProps) {
  const cfg = VARIANT_CONFIG[variant];

  return (
    <AlertDialog open onOpenChange={(open) => { if (!open) onCancel(); }}>
      <AlertDialogContent
        size="sm"
        className="gap-4"
        style={{ fontFamily: "inherit" }}
      >
        <AlertDialogHeader className="gap-3">
          <AlertDialogMedia
            className={cfg.mediaClass}
            style={{ width: 44, height: 44, borderRadius: 10 }}
          >
            {cfg.icon}
          </AlertDialogMedia>

          <AlertDialogTitle style={{ fontSize: 16, fontWeight: 600, fontFamily: "inherit" }}>
            {title}
          </AlertDialogTitle>

          <AlertDialogDescription style={{ fontSize: 13, lineHeight: 1.6, fontFamily: "inherit" }}>
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter
          className="grid grid-cols-2 gap-2"
          style={{ marginTop: 4 }}
        >
          <AlertDialogCancel
            onClick={onCancel}
            disabled={loading}
            variant="outline"
            style={{ fontFamily: "inherit", fontSize: 13, fontWeight: 500 }}
          >
            {cancelLabel}
          </AlertDialogCancel>

          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            variant={cfg.actionVariant}
            style={{
              fontFamily: "inherit",
              fontSize:   13,
              fontWeight: 500,
              opacity:    loading ? 0.7 : 1,
              cursor:     loading ? "not-allowed" : "pointer",
              ...cfg.actionStyle,
            }}
          >
            {loading ? "Processing…" : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>

      </AlertDialogContent>
    </AlertDialog>
  );
}