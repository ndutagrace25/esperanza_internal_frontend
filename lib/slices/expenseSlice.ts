import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { expenseService } from "../services/expenseService";
import type { Expense, PaginatedResponse } from "../types";
import type {
  ExpensePaginationOptions,
  CreateExpenseData,
  UpdateExpenseData,
} from "../services/expenseService";

// Initial state
interface ExpenseState {
  expenses: Expense[];
  currentExpense: Expense | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ExpenseState = {
  expenses: [],
  currentExpense: null,
  pagination: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchExpenses = createAsyncThunk<
  PaginatedResponse<Expense>,
  ExpensePaginationOptions | undefined,
  { rejectValue: { error: string } }
>("expense/fetchExpenses", async (options, { rejectWithValue }) => {
  try {
    return await expenseService.getAll(options);
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
      error: "Failed to fetch expenses",
    });
  }
});

export const fetchExpenseById = createAsyncThunk<
  Expense,
  string,
  { rejectValue: { error: string } }
>("expense/fetchExpenseById", async (id, { rejectWithValue }) => {
  try {
    return await expenseService.getById(id);
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
      error: "Failed to fetch expense",
    });
  }
});

export const createExpense = createAsyncThunk<
  Expense,
  CreateExpenseData,
  { rejectValue: { error: string } }
>("expense/createExpense", async (data, { rejectWithValue }) => {
  try {
    return await expenseService.create(data);
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
      error: "Failed to create expense",
    });
  }
});

export const updateExpense = createAsyncThunk<
  Expense,
  { id: string; data: UpdateExpenseData },
  { rejectValue: { error: string } }
>("expense/updateExpense", async ({ id, data }, { rejectWithValue }) => {
  try {
    return await expenseService.update(id, data);
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
      error: "Failed to update expense",
    });
  }
});

export const approveExpense = createAsyncThunk<
  Expense,
  string,
  { rejectValue: { error: string } }
>("expense/approveExpense", async (id, { rejectWithValue }) => {
  try {
    return await expenseService.approve(id);
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
      error: "Failed to approve expense",
    });
  }
});

export const markExpenseAsPaid = createAsyncThunk<
  Expense,
  string,
  { rejectValue: { error: string } }
>("expense/markExpenseAsPaid", async (id, { rejectWithValue }) => {
  try {
    return await expenseService.markAsPaid(id);
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
      error: "Failed to mark expense as paid",
    });
  }
});

export const rejectExpense = createAsyncThunk<
  Expense,
  { id: string; rejectionReason: string },
  { rejectValue: { error: string } }
>(
  "expense/rejectExpense",
  async ({ id, rejectionReason }, { rejectWithValue }) => {
    try {
      return await expenseService.reject(id, rejectionReason);
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
        error: "Failed to reject expense",
      });
    }
  }
);

export const cancelExpense = createAsyncThunk<
  Expense,
  string,
  { rejectValue: { error: string } }
>("expense/cancelExpense", async (id, { rejectWithValue }) => {
  try {
    return await expenseService.cancel(id);
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
      error: "Failed to cancel expense",
    });
  }
});

export const deleteExpense = createAsyncThunk<
  string,
  string,
  { rejectValue: { error: string } }
>("expense/deleteExpense", async (id, { rejectWithValue }) => {
  try {
    await expenseService.delete(id);
    return id;
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
      error: "Failed to delete expense",
    });
  }
});

// Slice
const expenseSlice = createSlice({
  name: "expense",
  initialState,
  reducers: {
    clearExpenseError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Expenses
    builder
      .addCase(fetchExpenses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.expenses = action.payload.data;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.error || "Failed to fetch expenses";
      });

    // Fetch Expense by ID
    builder
      .addCase(fetchExpenseById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.currentExpense = null;
      })
      .addCase(fetchExpenseById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentExpense = action.payload;
        state.error = null;
      })
      .addCase(fetchExpenseById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.error || "Failed to fetch expense";
        state.currentExpense = null;
      });

    // Create Expense
    builder
      .addCase(createExpense.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createExpense.fulfilled, (state, action) => {
        state.isLoading = false;
        state.expenses.unshift(action.payload);
        state.error = null;
      })
      .addCase(createExpense.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.error || "Failed to create expense";
      });

    // Update Expense
    builder
      .addCase(updateExpense.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateExpense.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.expenses.findIndex(
          (expense) => expense.id === action.payload.id
        );
        if (index !== -1) {
          state.expenses[index] = action.payload;
        }
        if (
          state.currentExpense &&
          state.currentExpense.id === action.payload.id
        ) {
          state.currentExpense = action.payload;
        }
        state.error = null;
      })
      .addCase(updateExpense.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.error || "Failed to update expense";
      });

    // Approve Expense
    builder
      .addCase(approveExpense.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(approveExpense.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.expenses.findIndex(
          (expense) => expense.id === action.payload.id
        );
        if (index !== -1) {
          state.expenses[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(approveExpense.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.error || "Failed to approve expense";
      });

    // Mark as Paid
    builder
      .addCase(markExpenseAsPaid.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(markExpenseAsPaid.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.expenses.findIndex(
          (expense) => expense.id === action.payload.id
        );
        if (index !== -1) {
          state.expenses[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(markExpenseAsPaid.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          action.payload?.error || "Failed to mark expense as paid";
      });

    // Reject Expense
    builder
      .addCase(rejectExpense.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(rejectExpense.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.expenses.findIndex(
          (expense) => expense.id === action.payload.id
        );
        if (index !== -1) {
          state.expenses[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(rejectExpense.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.error || "Failed to reject expense";
      });

    // Cancel Expense
    builder
      .addCase(cancelExpense.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(cancelExpense.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.expenses.findIndex(
          (expense) => expense.id === action.payload.id
        );
        if (index !== -1) {
          state.expenses[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(cancelExpense.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.error || "Failed to cancel expense";
      });

    // Delete Expense
    builder
      .addCase(deleteExpense.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteExpense.fulfilled, (state, action) => {
        state.isLoading = false;
        state.expenses = state.expenses.filter(
          (expense) => expense.id !== action.payload
        );
        state.error = null;
      })
      .addCase(deleteExpense.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.error || "Failed to delete expense";
      });
  },
});

export const { clearExpenseError } = expenseSlice.actions;
export default expenseSlice.reducer;

