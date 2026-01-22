import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  token: null,
  hydrated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload || {};

      if (user !== undefined) state.user = user;
      if (token !== undefined) state.token = token;

      state.hydrated = true;
    },
    clearCredentials: (state) => {
      state.user = null;
      state.token = null;
      state.hydrated = true;
    },
  },
});

export const { setCredentials, clearCredentials } = authSlice.actions;

export const selectUser = (s) => s.auth.user;
export const selectToken = (s) => s.auth.token;
export const selectIsAuthenticated = (s) => s.auth.hydrated && Boolean(s.auth.token);

export default authSlice.reducer;
