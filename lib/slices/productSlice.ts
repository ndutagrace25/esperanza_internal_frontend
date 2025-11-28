import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { productService } from "../services/productService";
import type { Product, PaginatedResponse, PaginationOptions } from "../types";
import type {
  CreateProductData,
  UpdateProductData,
} from "../services/productService";

// Initial state
interface ProductState {
  products: Product[];
  currentProduct: Product | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ProductState = {
  products: [],
  currentProduct: null,
  pagination: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchProducts = createAsyncThunk<
  PaginatedResponse<Product>,
  PaginationOptions | undefined,
  { rejectValue: { error: string } }
>("product/fetchProducts", async (options, { rejectWithValue }) => {
  try {
    return await productService.getAll(options);
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      error.response &&
      typeof error.response === "object" &&
      "data" in error.response
    ) {
      return rejectWithValue(error.response.data as { error: string });
    }
    return rejectWithValue({
      error: "Failed to fetch products",
    });
  }
});

export const fetchProductById = createAsyncThunk<
  Product,
  string,
  { rejectValue: { error: string } }
>("product/fetchProductById", async (id, { rejectWithValue }) => {
  try {
    return await productService.getById(id);
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      error.response &&
      typeof error.response === "object" &&
      "data" in error.response
    ) {
      return rejectWithValue(error.response.data as { error: string });
    }
    return rejectWithValue({
      error: "Failed to fetch product",
    });
  }
});

export const createProduct = createAsyncThunk<
  Product,
  CreateProductData,
  { rejectValue: { error: string } }
>("product/createProduct", async (data, { rejectWithValue }) => {
  try {
    return await productService.create(data);
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      error.response &&
      typeof error.response === "object" &&
      "data" in error.response
    ) {
      return rejectWithValue(error.response.data as { error: string });
    }
    return rejectWithValue({
      error: "Failed to create product",
    });
  }
});

export const updateProduct = createAsyncThunk<
  Product,
  { id: string; data: UpdateProductData },
  { rejectValue: { error: string } }
>("product/updateProduct", async ({ id, data }, { rejectWithValue }) => {
  try {
    return await productService.update(id, data);
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      error.response &&
      typeof error.response === "object" &&
      "data" in error.response
    ) {
      return rejectWithValue(error.response.data as { error: string });
    }
    return rejectWithValue({
      error: "Failed to update product",
    });
  }
});

export const deleteProduct = createAsyncThunk<
  string, // Return the ID of the deleted product
  string,
  { rejectValue: { error: string } }
>("product/deleteProduct", async (id, { rejectWithValue }) => {
  try {
    await productService.delete(id);
    return id; // Return the ID on success
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      error.response &&
      typeof error.response === "object" &&
      "data" in error.response
    ) {
      return rejectWithValue(error.response.data as { error: string });
    }
    return rejectWithValue({
      error: "Failed to delete product",
    });
  }
});

// Slice
const productSlice = createSlice({
  name: "product",
  initialState,
  reducers: {
    clearProductError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Products
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products = action.payload.data;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.error || "Failed to fetch products";
      });

    // Fetch Product by ID
    builder
      .addCase(fetchProductById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.currentProduct = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProduct = action.payload;
        state.error = null;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.error || "Failed to fetch product";
        state.currentProduct = null;
      });

    // Create Product
    builder
      .addCase(createProduct.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        // Add new product to the list
        state.products.unshift(action.payload);
        state.error = null;
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.error || "Failed to create product";
      });

    // Update Product
    builder
      .addCase(updateProduct.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update product in the list
        const index = state.products.findIndex(
          (prod) => prod.id === action.payload.id
        );
        if (index !== -1) {
          state.products[index] = action.payload;
        }
        // Update current product if it's the one being updated
        if (
          state.currentProduct &&
          state.currentProduct.id === action.payload.id
        ) {
          state.currentProduct = action.payload;
        }
        state.error = null;
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.error || "Failed to update product";
      });

    // Delete Product
    builder
      .addCase(deleteProduct.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products = state.products.filter(
          (prod) => prod.id !== action.payload
        );
        state.error = null;
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.error || "Failed to delete product";
      });
  },
});

export const { clearProductError } = productSlice.actions;
export default productSlice.reducer;

