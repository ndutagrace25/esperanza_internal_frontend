import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { clientService } from "../services/clientService";
import type { Client, PaginatedResponse, PaginationOptions } from "../types";
import type {
  CreateClientData,
  UpdateClientData,
} from "../services/clientService";

// Initial state
interface ClientState {
  clients: Client[];
  currentClient: Client | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ClientState = {
  clients: [],
  currentClient: null,
  pagination: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchClients = createAsyncThunk<
  PaginatedResponse<Client>,
  PaginationOptions | undefined,
  { rejectValue: { error: string } }
>("client/fetchClients", async (options, { rejectWithValue }) => {
  try {
    return await clientService.getAll(options);
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
      error: "Failed to fetch clients",
    });
  }
});

export const fetchClientById = createAsyncThunk<
  Client,
  string,
  { rejectValue: { error: string } }
>("client/fetchClientById", async (id, { rejectWithValue }) => {
  try {
    return await clientService.getById(id);
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
      error: "Failed to fetch client",
    });
  }
});

export const createClient = createAsyncThunk<
  Client,
  CreateClientData,
  { rejectValue: { error: string } }
>("client/createClient", async (data, { rejectWithValue }) => {
  try {
    return await clientService.create(data);
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
      error: "Failed to create client",
    });
  }
});

export const updateClient = createAsyncThunk<
  Client,
  { id: string; data: UpdateClientData },
  { rejectValue: { error: string } }
>("client/updateClient", async ({ id, data }, { rejectWithValue }) => {
  try {
    return await clientService.update(id, data);
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
      error: "Failed to update client",
    });
  }
});

export const deleteClient = createAsyncThunk<
  string, // Return the ID of the deleted client
  string,
  { rejectValue: { error: string } }
>("client/deleteClient", async (id, { rejectWithValue }) => {
  try {
    await clientService.delete(id);
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
      error: "Failed to delete client",
    });
  }
});

// Slice
const clientSlice = createSlice({
  name: "client",
  initialState,
  reducers: {
    clearClientError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Clients
    builder
      .addCase(fetchClients.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchClients.fulfilled, (state, action) => {
        state.isLoading = false;
        state.clients = action.payload.data;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(fetchClients.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.error || "Failed to fetch clients";
      });

    // Fetch Client by ID
    builder
      .addCase(fetchClientById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.currentClient = null;
      })
      .addCase(fetchClientById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentClient = action.payload;
        state.error = null;
      })
      .addCase(fetchClientById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.error || "Failed to fetch client";
        state.currentClient = null;
      });

    // Create Client
    builder
      .addCase(createClient.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createClient.fulfilled, (state, action) => {
        state.isLoading = false;
        // Add new client to the list
        state.clients.unshift(action.payload);
        state.error = null;
      })
      .addCase(createClient.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.error || "Failed to create client";
      });

    // Update Client
    builder
      .addCase(updateClient.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateClient.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update client in the list
        const index = state.clients.findIndex(
          (client) => client.id === action.payload.id
        );
        if (index !== -1) {
          state.clients[index] = action.payload;
        }
        // Update current client if it's the one being updated
        if (
          state.currentClient &&
          state.currentClient.id === action.payload.id
        ) {
          state.currentClient = action.payload;
        }
        state.error = null;
      })
      .addCase(updateClient.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.error || "Failed to update client";
      });

    // Delete Client
    builder
      .addCase(deleteClient.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteClient.fulfilled, (state, action) => {
        state.isLoading = false;
        state.clients = state.clients.filter(
          (client) => client.id !== action.payload
        );
        state.error = null;
      })
      .addCase(deleteClient.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.error || "Failed to delete client";
      });
  },
});

export const { clearClientError } = clientSlice.actions;
export default clientSlice.reducer;
