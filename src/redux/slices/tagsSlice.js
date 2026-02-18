// src/redux/slices/tagsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosSecure from "../../components/utils/axiosSecure";

export const fetchTags = createAsyncThunk(
  "tags/fetchTags",
  async (_, { getState, rejectWithValue }) => {
    // Already loaded — skip the network request
    const { tags } = getState();
    if (tags.items.length > 0) return tags.items;

    try {
      const res = await axiosSecure.get("/v1/community/tags/");
      return Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to load tags");
    }
  }
);

const tagsSlice = createSlice({
  name: "tags",
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTags.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTags.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
      })
      .addCase(fetchTags.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default tagsSlice.reducer;