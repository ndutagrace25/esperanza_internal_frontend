import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { clientIntegrationService } from "../services/clientIntegrationService";
import type { ClientIntegration } from "../types";
import type {
  CreateClientIntegrationData,
  UpdateClientIntegrationData,
} from "../services/clientIntegrationService";

interface ClientIntegrationState {
  integrations: ClientIntegration[];
  selectedClientId: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ClientIntegrationState = {
  integrations: [],
  selectedClientId: null,
  isLoading: false,
  error: null,
};

export const fetchIntegrationsByClientId = createAsyncThunk<
  ClientIntegration[],
  string,
  { rejectValue: { error: string } }
>(
  "clientIntegration/fetchByClientId",
  async (clientId, { rejectWithValue }) => {
    try {
      return await clientIntegrationService.getByClientId(clientId);
    } catch (error: unknown) {
      if (
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response
      ) {
        return rejectWithValue(
          (error.response as { data: { error: string } }).data
        );
      }
      return rejectWithValue({
        error: "Failed to fetch client integrations",
      });
    }
  }
);

export const createIntegration = createAsyncThunk<
  ClientIntegration,
  CreateClientIntegrationData,
  { rejectValue: { error: string } }
>(
  "clientIntegration/create",
  async (data, { rejectWithValue }) => {
    try {
      return await clientIntegrationService.create(data);
    } catch (error: unknown) {
      if (
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response
      ) {
        return rejectWithValue(
          (error.response as { data: { error: string } }).data
        );
      }
      return rejectWithValue({
        error: "Failed to create integration",
      });
    }
  }
);

export const updateIntegration = createAsyncThunk<
  ClientIntegration,
  { id: string; data: UpdateClientIntegrationData },
  { rejectValue: { error: string } }
>(
  "clientIntegration/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await clientIntegrationService.update(id, data);
    } catch (error: unknown) {
      if (
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response
      ) {
        return rejectWithValue(
          (error.response as { data: { error: string } }).data
        );
      }
      return rejectWithValue({
        error: "Failed to update integration",
      });
    }
  }
);

export const deleteIntegration = createAsyncThunk<
  string,
  string,
  { rejectValue: { error: string } }
>(
  "clientIntegration/delete",
  async (id, { rejectWithValue }) => {
    try {
      await clientIntegrationService.remove(id);
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
        return rejectWithValue(
          (error.response as { data: { error: string } }).data
        );
      }
      return rejectWithValue({
        error: "Failed to delete integration",
      });
    }
  }
);

const clientIntegrationSlice = createSlice({
  name: "clientIntegration",
  initialState,
  reducers: {
    clearClientIntegrationError: (state) => {
      state.error = null;
    },
    setSelectedClientId: (state, action: { payload: string | null }) => {
      state.selectedClientId = action.payload;
      if (!action.payload) {
        state.integrations = [];
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchIntegrationsByClientId.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchIntegrationsByClientId.fulfilled, (state, action) => {
        state.isLoading = false;
        state.integrations = action.payload;
        state.error = null;
      })
      .addCase(fetchIntegrationsByClientId.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.error ?? "Failed to fetch integrations";
      });

    builder
      .addCase(createIntegration.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createIntegration.fulfilled, (state, action) => {
        state.isLoading = false;
        if (
          state.selectedClientId &&
          action.payload.clientId === state.selectedClientId
        ) {
          state.integrations.push(action.payload);
        }
        state.error = null;
      })
      .addCase(createIntegration.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.error ?? "Failed to create integration";
      });

    builder
      .addCase(updateIntegration.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateIntegration.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.integrations.findIndex(
          (i) => i.id === action.payload.id
        );
        if (index !== -1) {
          state.integrations[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(updateIntegration.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.error ?? "Failed to update integration";
      });

    builder
      .addCase(deleteIntegration.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteIntegration.fulfilled, (state, action) => {
        state.isLoading = false;
        state.integrations = state.integrations.filter(
          (i) => i.id !== action.payload
        );
        state.error = null;
      })
      .addCase(deleteIntegration.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.error ?? "Failed to delete integration";
      });
  },
});

export const {
  clearClientIntegrationError,
  setSelectedClientId,
} = clientIntegrationSlice.actions;
export default clientIntegrationSlice.reducer;
