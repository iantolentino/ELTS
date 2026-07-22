// src/store/ui.store.ts
// Global UI state (sidebar, modals) managed with Zustand

import { create } from "zustand";

interface UIStore {
  sidebarOpen: boolean;
  activeNav: string;
  newTicketOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  setActiveNav: (nav: string) => void;
  setNewTicketOpen: (open: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  activeNav: "tickets",
  newTicketOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActiveNav:   (nav)  => set({ activeNav: nav }),
  setNewTicketOpen:(open) => set({ newTicketOpen: open }),
}));
