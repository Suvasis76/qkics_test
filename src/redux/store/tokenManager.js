// src/redux/store/tokenManager.js

const TOKEN_KEY = "access_token";

export const setAccessToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

export const getAccessToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};
