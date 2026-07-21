import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchGigs = createAsyncThunk('gigs/fetch', async (params = {}, { rejectWithValue }) => {
  try { const { data } = await api.get('/gigs', { params }); return data; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});
export const fetchGigById = createAsyncThunk('gigs/fetchById', async (id, { rejectWithValue }) => {
  try { const { data } = await api.get(`/gigs/${id}`); return data; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});
export const createGig = createAsyncThunk('gigs/create', async (d, { rejectWithValue }) => {
  try { const { data } = await api.post('/gigs', d); return data; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

const gigSlice = createSlice({
  name: 'gigs',
  initialState: { gigs: [], currentGig: null, total: 0, totalPages: 0, currentPage: 1, loading: false, error: null },
  reducers: { clearCurrentGig: (s) => { s.currentGig = null; } },
  extraReducers: (b) => {
    b.addCase(fetchGigs.pending, (s) => { s.loading = true; })
     .addCase(fetchGigs.fulfilled, (s, a) => { s.loading = false; s.gigs = a.payload.gigs || []; s.total = a.payload.total; s.totalPages = a.payload.totalPages; s.currentPage = a.payload.currentPage; })
     .addCase(fetchGigs.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
     .addCase(fetchGigById.pending, (s) => { s.loading = true; })
     .addCase(fetchGigById.fulfilled, (s, a) => { s.loading = false; s.currentGig = a.payload.gig; })
     .addCase(fetchGigById.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
     .addCase(createGig.fulfilled, (s, a) => { s.gigs.unshift(a.payload.gig); });
  },
});

export const { clearCurrentGig } = gigSlice.actions;
export default gigSlice.reducer;
