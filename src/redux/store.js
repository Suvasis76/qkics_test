// src/redux/store.js
import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slices/userSlice";
import postsReducer from "./slices/postsSlice";
import expertReducer from "./slices/expertSlice";
import postViewReducer from "./slices/postViewSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    posts: postsReducer,
    expert: expertReducer,
    postView: postViewReducer,
  },
});

export default store;
