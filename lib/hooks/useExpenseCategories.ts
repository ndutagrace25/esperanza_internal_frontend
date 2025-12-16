import { useState, useEffect } from "react";
import { expenseService } from "../services/expenseService";
import type { ExpenseCategory } from "../types";

export function useExpenseCategories() {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const fetchedCategories = await expenseService.getAllCategories();
        setCategories(fetchedCategories);
      } catch (err: unknown) {
        if (
          err &&
          typeof err === "object" &&
          "response" in err &&
          (err.response as { data?: { error?: string } }).data &&
          (err.response as { data: { error?: string } }).data.error
        ) {
          setError(
            (err.response as { data: { error: string } }).data.error
          );
        } else {
          setError("Failed to fetch expense categories");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, isLoading, error };
}

