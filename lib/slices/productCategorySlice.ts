import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { productCategoryService } from "../services/productCategoryService";
import type { ProductCategory } from "../types";
import type {
  CreateProductCategoryData,
  UpdateProductCategoryData,
} from "../services/productCategoryService";

// Initial state
interface ProductCategoryState {
  categories: ProductCategory[];
  currentCategory: ProductCategory | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ProductCategoryState = {
  categories: [],
  currentCategory: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchProductCategories = createAsyncThunk<
  ProductCategory[],
  void,
  { rejectValue: { error: string } }
>("productCategory/fetchProductCategories", async (_, { rejectWithValue }) => {
  try {
    return await productCategoryService.getAll();
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
      error: "Failed to fetch product categories",
    });
  }
});

export const fetchProductCategoryById = createAsyncThunk<
  ProductCategory,
  string,
  { rejectValue: { error: string } }
>(
  "productCategory/fetchProductCategoryById",
  async (id, { rejectWithValue }) => {
    try {
      return await productCategoryService.getById(id);
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
        error: "Failed to fetch product category",
      });
    }
  }
);

export const createProductCategory = createAsyncThunk<
  ProductCategory,
  CreateProductCategoryData,
  { rejectValue: { error: string } }
>(
  "productCategory/createProductCategory",
  async (data, { rejectWithValue }) => {
    try {
      return await productCategoryService.create(data);
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
        error: "Failed to create product category",
      });
    }
  }
);

export const updateProductCategory = createAsyncThunk<
  ProductCategory,
  { id: string; data: UpdateProductCategoryData },
  { rejectValue: { error: string } }
>(
  "productCategory/updateProductCategory",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await productCategoryService.update(id, data);
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
        error: "Failed to update product category",
      });
    }
  }
);

export const deleteProductCategory = createAsyncThunk<
  string, // Return the ID of the deleted category
  string,
  { rejectValue: { error: string } }
>(
  "productCategory/deleteProductCategory",
  async (id, { rejectWithValue }) => {
    try {
      await productCategoryService.delete(id);
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
        error: "Failed to delete product category",
      });
    }
  }
);

// Slice
const productCategorySlice = createSlice({
  name: "productCategory",
  initialState,
  reducers: {
    clearProductCategoryError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Product Categories
    builder
      .addCase(fetchProductCategories.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProductCategories.fulfilled, (state, action) => {
        state.isLoading = false;
        state.categories = action.payload;
        state.error = null;
      })
      .addCase(fetchProductCategories.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          action.payload?.error || "Failed to fetch product categories";
      });

    // Fetch Product Category by ID
    builder
      .addCase(fetchProductCategoryById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.currentCategory = null;
      })
      .addCase(fetchProductCategoryById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentCategory = action.payload;
        state.error = null;
      })
      .addCase(fetchProductCategoryById.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          action.payload?.error || "Failed to fetch product category";
        state.currentCategory = null;
      });

    // Create Product Category
    builder
      .addCase(createProductCategory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createProductCategory.fulfilled, (state, action) => {
        state.isLoading = false;
        // Add new category to the list
        state.categories.push(action.payload);
        state.error = null;
      })
      .addCase(createProductCategory.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          action.payload?.error || "Failed to create product category";
      });

    // Update Product Category
    builder
      .addCase(updateProductCategory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProductCategory.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update category in the list
        const index = state.categories.findIndex(
          (cat) => cat.id === action.payload.id
        );
        if (index !== -1) {
          state.categories[index] = action.payload;
        }
        // Update current category if it's the one being updated
        if (
          state.currentCategory &&
          state.currentCategory.id === action.payload.id
        ) {
          state.currentCategory = action.payload;
        }
        state.error = null;
      })
      .addCase(updateProductCategory.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          action.payload?.error || "Failed to update product category";
      });

    // Delete Product Category
    builder
      .addCase(deleteProductCategory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteProductCategory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.categories = state.categories.filter(
          (cat) => cat.id !== action.payload
        );
        state.error = null;
      })
      .addCase(deleteProductCategory.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          action.payload?.error || "Failed to delete product category";
      });
  },
});

export const { clearProductCategoryError } = productCategorySlice.actions;
export default productCategorySlice.reducer;

