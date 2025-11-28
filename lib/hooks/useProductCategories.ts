import { useState, useEffect } from "react";
import { productCategoryService } from "../services/productCategoryService";
import type { ProductCategory } from "../types";

export function useProductCategories() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const fetchedCategories = await productCategoryService.getAll();
        setCategories(fetchedCategories);
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
          setError("Failed to fetch product categories");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, isLoading, error };
}

