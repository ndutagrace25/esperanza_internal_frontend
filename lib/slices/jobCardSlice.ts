import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { jobCardService } from "../services/jobCardService";
import type { JobCard, PaginatedResponse, PaginationOptions } from "../types";
import type {
  CreateJobCardData,
  UpdateJobCardData,
} from "../services/jobCardService";

// Initial state
interface JobCardState {
  jobCards: JobCard[];
  currentJobCard: JobCard | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: JobCardState = {
  jobCards: [],
  currentJobCard: null,
  pagination: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchJobCards = createAsyncThunk<
  PaginatedResponse<JobCard>,
  PaginationOptions | undefined,
  { rejectValue: { error: string } }
>("jobCard/fetchJobCards", async (options, { rejectWithValue }) => {
  try {
    return await jobCardService.getAll(options);
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
      error: "Failed to fetch job cards",
    });
  }
});

export const fetchJobCardById = createAsyncThunk<
  JobCard,
  string,
  { rejectValue: { error: string } }
>("jobCard/fetchJobCardById", async (id, { rejectWithValue }) => {
  try {
    return await jobCardService.getById(id);
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
      error: "Failed to fetch job card",
    });
  }
});

export const createJobCard = createAsyncThunk<
  JobCard,
  CreateJobCardData,
  { rejectValue: { error: string } }
>("jobCard/createJobCard", async (data, { rejectWithValue }) => {
  try {
    return await jobCardService.create(data);
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
      error: "Failed to create job card",
    });
  }
});

export const updateJobCard = createAsyncThunk<
  JobCard,
  { id: string; data: UpdateJobCardData },
  { rejectValue: { error: string } }
>("jobCard/updateJobCard", async ({ id, data }, { rejectWithValue }) => {
  try {
    return await jobCardService.update(id, data);
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
      error: "Failed to update job card",
    });
  }
});

export const deleteJobCard = createAsyncThunk<
  string, // Return the ID of the deleted job card
  string,
  { rejectValue: { error: string } }
>("jobCard/deleteJobCard", async (id, { rejectWithValue }) => {
  try {
    await jobCardService.delete(id);
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
      error: "Failed to delete job card",
    });
  }
});

// Slice
const jobCardSlice = createSlice({
  name: "jobCard",
  initialState,
  reducers: {
    clearJobCardError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Job Cards
    builder
      .addCase(fetchJobCards.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchJobCards.fulfilled, (state, action) => {
        state.isLoading = false;
        state.jobCards = action.payload.data;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(fetchJobCards.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.error || "Failed to fetch job cards";
      });

    // Fetch Job Card by ID
    builder
      .addCase(fetchJobCardById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.currentJobCard = null;
      })
      .addCase(fetchJobCardById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentJobCard = action.payload;
        state.error = null;
      })
      .addCase(fetchJobCardById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.error || "Failed to fetch job card";
        state.currentJobCard = null;
      });

    // Create Job Card
    builder
      .addCase(createJobCard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createJobCard.fulfilled, (state, action) => {
        state.isLoading = false;
        // Add new job card to the list
        state.jobCards.unshift(action.payload);
        state.error = null;
      })
      .addCase(createJobCard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.error || "Failed to create job card";
      });

    // Update Job Card
    builder
      .addCase(updateJobCard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateJobCard.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update job card in the list
        const index = state.jobCards.findIndex(
          (jc) => jc.id === action.payload.id
        );
        if (index !== -1) {
          state.jobCards[index] = action.payload;
        }
        // Update current job card if it's the one being updated
        if (
          state.currentJobCard &&
          state.currentJobCard.id === action.payload.id
        ) {
          state.currentJobCard = action.payload;
        }
        state.error = null;
      })
      .addCase(updateJobCard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.error || "Failed to update job card";
      });

    // Delete Job Card
    builder
      .addCase(deleteJobCard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteJobCard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.jobCards = state.jobCards.filter(
          (jc) => jc.id !== action.payload
        );
        state.error = null;
      })
      .addCase(deleteJobCard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.error || "Failed to delete job card";
      });
  },
});

export const { clearJobCardError } = jobCardSlice.actions;
export default jobCardSlice.reducer;

