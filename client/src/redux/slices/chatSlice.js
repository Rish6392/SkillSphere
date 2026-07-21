import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchConversations = createAsyncThunk('chat/conversations', async (_, { rejectWithValue }) => {
  try { const { data } = await api.get('/messages/conversations'); return data; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});
export const fetchMessages = createAsyncThunk('chat/messages', async (id, { rejectWithValue }) => {
  try { const { data } = await api.get(`/messages/${id}`); return { conversationId: id, ...data }; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

const chatSlice = createSlice({
  name: 'chat',
  initialState: { conversations: [], messages: [], onlineUsers: [], typingUsers: {}, loading: false },
  reducers: {
    addMessage: (s, a) => { s.messages.push(a.payload); },
    setOnlineUsers: (s, a) => { s.onlineUsers = a.payload; },
    setTyping: (s, a) => { const { conversationId, userId, isTyping } = a.payload; if (isTyping) s.typingUsers[conversationId] = userId; else delete s.typingUsers[conversationId]; },
  },
  extraReducers: (b) => {
    b.addCase(fetchConversations.fulfilled, (s, a) => { s.conversations = a.payload.conversations || []; s.loading = false; })
     .addCase(fetchMessages.fulfilled, (s, a) => { s.messages = a.payload.messages || []; s.loading = false; });
  },
});

export const { addMessage, setOnlineUsers, setTyping } = chatSlice.actions;
export default chatSlice.reducer;
