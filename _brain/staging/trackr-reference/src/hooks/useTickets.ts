// src/hooks/useTickets.ts
// Data fetching hook — keeps API logic out of components

import { useState, useEffect, useCallback } from "react";
import type { Ticket } from "@/types";

interface Filters {
  status?: string;
  priority?: string;
  search?: string;
}

export function useTickets(filters: Filters = {}) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.status)   params.set("status",   filters.status);
      if (filters.priority) params.set("priority", filters.priority);
      if (filters.search)   params.set("search",   filters.search);

      const res = await fetch(`/api/tickets?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load tickets");

      const json = await res.json();
      setTickets(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.priority, filters.search]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const createTicket = async (data: Partial<Ticket>) => {
    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create ticket");
    await fetchTickets();
  };

  const updateTicket = async (id: string, data: Partial<Ticket>) => {
    const res = await fetch(`/api/tickets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update ticket");
    await fetchTickets();
  };

  const deleteTicket = async (id: string) => {
    const res = await fetch(`/api/tickets/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete ticket");
    setTickets((prev) => prev.filter((t) => t.id !== id));
  };

  return { tickets, loading, error, createTicket, updateTicket, deleteTicket, refetch: fetchTickets };
}
