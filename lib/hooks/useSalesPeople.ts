import { useState, useEffect, useCallback } from "react";
import { salesPersonService } from "../services/salesPersonService";
import type { SalesPerson } from "../types";

export function useSalesPeople() {
  const [salesPeople, setSalesPeople] = useState<SalesPerson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await salesPersonService.getAll({ limit: 100 });
      setSalesPeople(result.data);
    } catch {
      setError("Failed to fetch sales people");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { salesPeople, isLoading, error, refetch };
}
