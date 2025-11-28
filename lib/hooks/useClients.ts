import { useState, useEffect } from "react";
import { clientService } from "../services/clientService";
import type { Client } from "../types";

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setIsLoading(true);
        // Fetch clients in batches if needed, but start with max allowed limit
        const result = await clientService.getAll({ limit: 100 }); // Get clients for dropdown (max 100 per request)
        setClients(result.data);
      } catch (err: unknown) {
        if (
          err &&
          typeof err === "object" &&
          "response" in err &&
          (err.response as any).data &&
          (err.response as any).data.error
        ) {
          setError((err.response as any).data.error);
        } else {
          setError("Failed to fetch clients");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchClients();
  }, []);

  return { clients, isLoading, error };
}

