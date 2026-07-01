import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { clientSubscriptionService } from "../services/clientSubscriptionService";
import type { ClientSubscription } from "../types";
import type {
  CreateClientSubscriptionData,
  RenewClientSubscriptionData,
  UpdateClientSubscriptionData,
  ClientSubscriptionListFilters,
} from "../services/clientSubscriptionService";

interface ClientSubscriptionState {
  subscriptions: ClientSubscription[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ClientSubscriptionState = {
  subscriptions: [],
  isLoading: false,
  error: null,
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response &&
    error.response.data &&
    typeof error.response.data === "object" &&
    "error" in error.response.data &&
    typeof (error.response.data as { error: unknown }).error === "string"
  ) {
    return (error.response.data as { error: string }).error;
  }
  return fallback;
}

export const fetchClientSubscriptions = createAsyncThunk<
  ClientSubscription[],
  ClientSubscriptionListFilters | undefined,
  { rejectValue: { error: string } }
>("clientSubscription/fetchAll", async (filters, { rejectWithValue }) => {
  try {
    return await clientSubscriptionService.getAll(filters);
  } catch (error: unknown) {
    return rejectWithValue({
      error: getErrorMessage(error, "Failed to fetch client subscriptions"),
    });
  }
});

export const createClientSubscription = createAsyncThunk<
  ClientSubscription,
  CreateClientSubscriptionData,
  { rejectValue: { error: string } }
>("clientSubscription/create", async (data, { rejectWithValue }) => {
  try {
    return await clientSubscriptionService.create(data);
  } catch (error: unknown) {
    return rejectWithValue({
      error: getErrorMessage(error, "Failed to create client subscription"),
    });
  }
});

export const updateClientSubscription = createAsyncThunk<
  ClientSubscription,
  { id: string; data: UpdateClientSubscriptionData },
  { rejectValue: { error: string } }
>("clientSubscription/update", async ({ id, data }, { rejectWithValue }) => {
  try {
    return await clientSubscriptionService.update(id, data);
  } catch (error: unknown) {
    return rejectWithValue({
      error: getErrorMessage(error, "Failed to update client subscription"),
    });
  }
});

export const renewClientSubscription = createAsyncThunk<
  ClientSubscription,
  { id: string; data: RenewClientSubscriptionData },
  { rejectValue: { error: string } }
>("clientSubscription/renew", async ({ id, data }, { rejectWithValue }) => {
  try {
    return await clientSubscriptionService.renew(id, data);
  } catch (error: unknown) {
    return rejectWithValue({
      error: getErrorMessage(error, "Failed to renew client subscription"),
    });
  }
});

const clientSubscriptionSlice = createSlice({
  name: "clientSubscription",
  initialState,
  reducers: {
    clearClientSubscriptionError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClientSubscriptions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchClientSubscriptions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.subscriptions = action.payload;
      })
      .addCase(fetchClientSubscriptions.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          action.payload?.error ?? "Failed to fetch client subscriptions";
      });

    builder
      .addCase(createClientSubscription.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createClientSubscription.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(createClientSubscription.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          action.payload?.error ?? "Failed to create client subscription";
      });

    builder
      .addCase(updateClientSubscription.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateClientSubscription.fulfilled, (state, action) => {
        state.isLoading = false;
        const idx = state.subscriptions.findIndex(
          (s) => s.id === action.payload.id
        );
        if (idx !== -1) state.subscriptions[idx] = action.payload;
      })
      .addCase(updateClientSubscription.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          action.payload?.error ?? "Failed to update client subscription";
      });

    builder
      .addCase(renewClientSubscription.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(renewClientSubscription.fulfilled, (state, action) => {
        state.isLoading = false;
        const idx = state.subscriptions.findIndex(
          (s) => s.id === action.payload.id
        );
        if (idx !== -1) state.subscriptions[idx] = action.payload;
      })
      .addCase(renewClientSubscription.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          action.payload?.error ?? "Failed to renew client subscription";
      });
  },
});

export const { clearClientSubscriptionError } =
  clientSubscriptionSlice.actions;
export default clientSubscriptionSlice.reducer;
