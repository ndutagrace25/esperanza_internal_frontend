import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { saleService } from "../services/saleService";
import type { Sale, PaginatedResponse, PaginationOptions } from "../types";
import type {
  CreateSaleData,
  UpdateSaleData,
} from "../services/saleService";

// Initial state
interface SaleState {
  sales: Sale[];
  currentSale: Sale | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: SaleState = {
  sales: [],
  currentSale: null,
  pagination: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchSales = createAsyncThunk<
  PaginatedResponse<Sale>,
  PaginationOptions | undefined,
  { rejectValue: { error: string } }
>("sale/fetchSales", async (options, { rejectWithValue }) => {
  try {
    return await saleService.getAll(options);
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
      error: "Failed to fetch sales",
    });
  }
});

export const fetchSaleById = createAsyncThunk<
  Sale,
  string,
  { rejectValue: { error: string } }
>("sale/fetchSaleById", async (id, { rejectWithValue }) => {
  try {
    return await saleService.getById(id);
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
      error: "Failed to fetch sale",
    });
  }
});

export const createSale = createAsyncThunk<
  Sale,
  CreateSaleData,
  { rejectValue: { error: string } }
>("sale/createSale", async (data, { rejectWithValue }) => {
  try {
    return await saleService.create(data);
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
      error: "Failed to create sale",
    });
  }
});

export const updateSale = createAsyncThunk<
  Sale,
  { id: string; data: UpdateSaleData },
  { rejectValue: { error: string } }
>("sale/updateSale", async ({ id, data }, { rejectWithValue }) => {
  try {
    return await saleService.update(id, data);
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
      error: "Failed to update sale",
    });
  }
});

export const deleteSale = createAsyncThunk<
  string, // Return the ID of the deleted sale
  string,
  { rejectValue: { error: string } }
>("sale/deleteSale", async (id, { rejectWithValue }) => {
  try {
    await saleService.delete(id);
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
      error: "Failed to delete sale",
    });
  }
});

// Slice
const saleSlice = createSlice({
  name: "sale",
  initialState,
  reducers: {
    clearSaleError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Sales
    builder
      .addCase(fetchSales.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSales.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sales = action.payload.data;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(fetchSales.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.error || "Failed to fetch sales";
      });

    // Fetch Sale by ID
    builder
      .addCase(fetchSaleById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.currentSale = null;
      })
      .addCase(fetchSaleById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentSale = action.payload;
        state.error = null;
      })
      .addCase(fetchSaleById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.error || "Failed to fetch sale";
        state.currentSale = null;
      });

    // Create Sale
    builder
      .addCase(createSale.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createSale.fulfilled, (state, action) => {
        state.isLoading = false;
        // Add new sale to the list
        state.sales.unshift(action.payload);
        state.error = null;
      })
      .addCase(createSale.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.error || "Failed to create sale";
      });

    // Update Sale
    builder
      .addCase(updateSale.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateSale.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update sale in the list
        const index = state.sales.findIndex(
          (sale) => sale.id === action.payload.id
        );
        if (index !== -1) {
          state.sales[index] = action.payload;
        }
        // Update current sale if it's the one being updated
        if (
          state.currentSale &&
          state.currentSale.id === action.payload.id
        ) {
          state.currentSale = action.payload;
        }
        state.error = null;
      })
      .addCase(updateSale.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.error || "Failed to update sale";
      });

    // Delete Sale
    builder
      .addCase(deleteSale.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteSale.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sales = state.sales.filter(
          (sale) => sale.id !== action.payload
        );
        state.error = null;
      })
      .addCase(deleteSale.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.error || "Failed to delete sale";
      });
  },
});

export const { clearSaleError } = saleSlice.actions;
export default saleSlice.reducer;

