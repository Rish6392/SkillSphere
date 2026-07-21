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
  initialState: { conversations: [], messages: [], onlineUsers: [], typingUsers: {}, loading: false, activeConversationId: null },
  reducers: {
    setActiveConversationId: (s, a) => { s.activeConversationId = a.payload; },
    addMessage: (s, a) => { 
      const msg = a.payload;
      // Update last message preview in conversation list
      const convo = s.conversations.find(c => c._id === msg.conversationId);
      if (convo) {
        convo.lastMessage = msg.content;
        convo.lastMessageAt = msg.createdAt;
      }
      // Only push to active message view if it belongs to the current chat
      if (msg.conversationId === s.activeConversationId) {
        s.messages.push(msg); 
      }
    },
    setOnlineUsers: (s, a) => { s.onlineUsers = a.payload; },
    setTyping: (s, a) => { const { conversationId, userId, isTyping } = a.payload; if (isTyping) s.typingUsers[conversationId] = userId; else delete s.typingUsers[conversationId]; },
  },
  extraReducers: (b) => {
    b.addCase(fetchConversations.fulfilled, (s, a) => { s.conversations = a.payload.conversations || []; s.loading = false; })
     .addCase(fetchMessages.fulfilled, (s, a) => { s.messages = a.payload.messages || []; s.loading = false; });
  },
});

export const { addMessage, setOnlineUsers, setTyping, setActiveConversationId } = chatSlice.actions;
export default chatSlice.reducer;
