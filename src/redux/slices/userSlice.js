import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosSecure from "../../components/utils/axiosSecure";
import { setAccessToken } from "../store/tokenManager";


// 1️⃣ Fetch logged-in user profile
export const fetchUserProfile = createAsyncThunk(
  "user/fetchProfile",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosSecure.get("/v1/auth/me/");
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Something went wrong");
    }
  }
);

// 2️⃣ Login
export const loginUser = createAsyncThunk(
  "user/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const res = await axiosSecure.post("/v1/auth/login/", credentials);

      // backend returns: { access, refresh (cookie), user: {} }
      const accessToken = res.data.access;
      const user = res.data.user;

      setAccessToken(accessToken);  // store only in memory

      return user; // return user object only
    } catch (err) {
      return rejectWithValue(err.response?.data || "Login failed");
    }
  }
);

// 3️⃣ Update Profile
export const updateUserProfile = createAsyncThunk(
  "user/updateProfile",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axiosSecure.patch(`/v1/users/${payload.id}/`, payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Update failed");
    }
  }
);


const userSlice = createSlice({
  name: "user",

  initialState: {
    data: null,
    role: null,
    status: "idle",
    error: null,
  },

  reducers: {
    logoutUser: (state) => {
      state.data = null;
      state.role = null;
      state.status = "idle";

      setAccessToken(null); // clear token from memory
    },

    setUserRole: (state, action) => {
      state.role = action.payload;
    },
  },

  extraReducers: (builder) => {
    builder

      // FETCH PROFILE
      .addCase(fetchUserProfile.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.status = "success";
        state.data = action.payload;
        state.role = action.payload.role;
      })
      .addCase(fetchUserProfile.rejected, (state) => {
        state.status = "error";
      });

    // LOGIN
    builder
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = "success";

        state.data = action.payload;
        state.role = action.payload.role;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "error";
        state.error = action.payload;
      });

    // PROFILE UPDATE
    builder.addCase(updateUserProfile.fulfilled, (state, action) => {
      state.data = { ...state.data, ...action.payload };
    });
  },
});

export const { logoutUser, setUserRole } = userSlice.actions;
export default userSlice.reducer;
