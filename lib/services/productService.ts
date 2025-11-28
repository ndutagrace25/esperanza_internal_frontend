import api from "../api";
import type { Product, PaginatedResponse, PaginationOptions } from "../types";

export type CreateProductData = Omit<
  Product,
  | "id"
  | "createdAt"
  | "updatedAt"
  | "category"
  | "categoryId"
> & {
  categoryId?: string | null;
};

export type UpdateProductData = Partial<
  Omit<Product, "id" | "createdAt" | "updatedAt" | "category">
> & {
  categoryId?: string | null;
};

// Get all products with pagination
export async function getAllProducts(
  options?: PaginationOptions
): Promise<PaginatedResponse<Product>> {
  const params = new URLSearchParams();
  if (options?.page) {
    params.append("page", options.page.toString());
  }
  if (options?.limit) {
    params.append("limit", options.limit.toString());
  }

  const queryString = params.toString();
  const url = `/products${queryString ? `?${queryString}` : ""}`;

  const response = await api.get<PaginatedResponse<Product>>(url);
  return response.data;
}

// Get product by ID
export async function getProductById(id: string): Promise<Product> {
  const response = await api.get<Product>(`/products/${id}`);
  return response.data;
}

// Create product
export async function createProduct(data: CreateProductData): Promise<Product> {
  const response = await api.post<Product>("/products", data);
  return response.data;
}

// Update product
export async function updateProduct(
  id: string,
  data: UpdateProductData
): Promise<Product> {
  const response = await api.patch<Product>(`/products/${id}`, data);
  return response.data;
}

// Delete product (discontinues it)
export async function deleteProduct(id: string): Promise<void> {
  await api.delete(`/products/${id}`);
}

export const productService = {
  getAll: getAllProducts,
  getById: getProductById,
  create: createProduct,
  update: updateProduct,
  delete: deleteProduct,
};

