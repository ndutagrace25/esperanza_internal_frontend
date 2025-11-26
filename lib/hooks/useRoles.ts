import { useEffect, useState } from "react";
import { roleService } from "../services/roleService";
import type { Role } from "../types";

export function useRoles(): {
  roles: Role[];
  isLoading: boolean;
  error: string | null;
} {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await roleService.getAll();
        setRoles(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch roles"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoles();
  }, []);

  return { roles, isLoading, error };
}

