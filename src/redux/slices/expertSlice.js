// src/redux/slices/expertSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosSecure from "../../components/utils/axiosSecure";

/* -----------------------------------------------------------
   1. LOAD EXPERT PROFILE
----------------------------------------------------------- */
export const loadExpertProfile = createAsyncThunk(
  "expert/loadExpertProfile",
  async (_, thunkAPI) => {
    try {
      const res = await axiosSecure.get("/v1/experts/me/profile/");
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || "Failed loading expert profile");
    }
  }
);

/* -----------------------------------------------------------
   2. UPDATE EXPERT PROFILE
----------------------------------------------------------- */
export const updateExpertProfile = createAsyncThunk(
  "expert/updateExpertProfile",
  async (updatedFields, thunkAPI) => {
    try {
      const res = await axiosSecure.patch("/v1/experts/me/profile/", updatedFields);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || "Update failed");
    }
  }
);

/* -----------------------------------------------------------
   REDUX SLICE
----------------------------------------------------------- */
const expertSlice = createSlice({
  name: "expert",
  initialState: {
    data: null,
    loading: false,
    error: null,
  },

  reducers: {
    // For adding experiences, education, certifications, honors later
    setExpertData(state, action) {
      state.data = action.payload;
    },
  },

  extraReducers: (builder) => {
    builder
      /* ---------------------------- LOAD PROFILE ---------------------------- */
      .addCase(loadExpertProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadExpertProfile.fulfilled, (state, action) => {
        state.data = action.payload;
        state.loading = false;
      })
      .addCase(loadExpertProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ---------------------------- UPDATE PROFILE ---------------------------- */
      .addCase(updateExpertProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateExpertProfile.fulfilled, (state, action) => {
        state.data = action.payload;
        state.loading = false;
      })
      .addCase(updateExpertProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setExpertData } = expertSlice.actions;
export default expertSlice.reducer;
