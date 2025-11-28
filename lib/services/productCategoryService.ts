import api from "../api";
import type { ProductCategory } from "../types";

export type CreateProductCategoryData = Omit<
  ProductCategory,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateProductCategoryData = Partial<
  Omit<ProductCategory, "id" | "createdAt" | "updatedAt">
>;

// Get all product categories
export async function getAllProductCategories(): Promise<ProductCategory[]> {
  const response = await api.get<ProductCategory[]>("/product-categories");
  return response.data;
}

// Get product category by ID
export async function getProductCategoryById(
  id: string
): Promise<ProductCategory> {
  const response = await api.get<ProductCategory>(`/product-categories/${id}`);
  return response.data;
}

// Create product category
export async function createProductCategory(
  data: CreateProductCategoryData
): Promise<ProductCategory> {
  const response = await api.post<ProductCategory>("/product-categories", data);
  return response.data;
}

// Update product category
export async function updateProductCategory(
  id: string,
  data: UpdateProductCategoryData
): Promise<ProductCategory> {
  const response = await api.patch<ProductCategory>(
    `/product-categories/${id}`,
    data
  );
  return response.data;
}

// Delete product category (archives it)
export async function deleteProductCategory(id: string): Promise<void> {
  await api.delete(`/product-categories/${id}`);
}

export const productCategoryService = {
  getAll: getAllProductCategories,
  getById: getProductCategoryById,
  create: createProductCategory,
  update: updateProductCategory,
  delete: deleteProductCategory,
};

