import { createSlice } from "@reduxjs/toolkit";

const postViewSlice = createSlice({
  name: "postView",
  initialState: {
    from: null,  // "normal-profile", "expert-profile", "feed"
    tab: null,   // "posts"
    scroll: 0,
  },

  reducers: {
    savePostViewState: (state, action) => {
      const { from, tab, scroll } = action.payload;
      state.from = from;
      state.tab = tab;
      state.scroll = scroll;
    },

    clearPostViewState: (state) => {
      state.from = null;
      state.tab = null;
      state.scroll = 0;
    },
  },
});

export const { savePostViewState, clearPostViewState } = postViewSlice.actions;
export default postViewSlice.reducer;
