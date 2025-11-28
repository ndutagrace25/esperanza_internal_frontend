import { useState, useEffect } from "react";
import { employeeService } from "../services/employeeService";
import type { Employee } from "../types";

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setIsLoading(true);
        const result = await employeeService.getAll();
        setEmployees(result.data);
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
          setError("Failed to fetch employees");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  return { employees, isLoading, error };
}

