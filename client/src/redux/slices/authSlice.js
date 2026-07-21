import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const registerUser = createAsyncThunk('auth/register', async (d, { rejectWithValue }) => {
  try { const { data } = await api.post('/auth/register', d); if (data.token) localStorage.setItem('token', data.token); return data; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Registration failed'); }
});
export const loginUser = createAsyncThunk('auth/login', async (d, { rejectWithValue }) => {
  try { const { data } = await api.post('/auth/login', d); if (data.token) localStorage.setItem('token', data.token); return data; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Login failed'); }
});
export const logoutUser = createAsyncThunk('auth/logout', async () => {
  try { await api.post('/auth/logout'); } catch(e) {}
  localStorage.removeItem('token'); localStorage.removeItem('user');
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    token: localStorage.getItem('token'),
    loading: false, error: null,
    isAuthenticated: !!localStorage.getItem('token'),
  },
  reducers: {
    clearError: (s) => { s.error = null; },
  },
  extraReducers: (b) => {
    b.addCase(registerUser.pending, (s) => { s.loading = true; s.error = null; })
     .addCase(registerUser.fulfilled, (s, a) => { s.loading = false; s.user = a.payload.user; s.token = a.payload.token; s.isAuthenticated = true; localStorage.setItem('user', JSON.stringify(a.payload.user)); })
     .addCase(registerUser.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
     .addCase(loginUser.pending, (s) => { s.loading = true; s.error = null; })
     .addCase(loginUser.fulfilled, (s, a) => { s.loading = false; s.user = a.payload.user; s.token = a.payload.token; s.isAuthenticated = true; localStorage.setItem('user', JSON.stringify(a.payload.user)); })
     .addCase(loginUser.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
     .addCase(logoutUser.fulfilled, (s) => { s.user = null; s.token = null; s.isAuthenticated = false; });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
