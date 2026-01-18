import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  token: null,      // Bearer / Sanctum personal token (e.g. "7|NS2AvY...")
  expiresAt: null,  // চাইলে JWT exp রাখবেন; আপাতত null থাকুক
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // { user, token } – যেকোনোটা দিতে পারেন
    setCredentials: (state, action) => {
      const { user, token } = action.payload || {};
      if (typeof user !== 'undefined') state.user = user;
      if (typeof token !== 'undefined') state.token = token || null;
    },
    clearCredentials: (state) => {
      state.user = null;
      state.token = null;
      state.expiresAt = null;
    },
  },
});

export const { setCredentials, clearCredentials } = authSlice.actions;

// Selectors
export const selectUser = (s) => s.auth.user;
export const selectToken = (s) => s.auth.token;
export const selectIsAuthenticated = (s) =>
  Boolean(s.auth.user) && Boolean(s.auth.token);

export default authSlice.reducer;
