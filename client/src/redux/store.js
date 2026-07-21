import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import gigReducer from './slices/gigSlice';
import chatReducer from './slices/chatSlice';

export default configureStore({
  reducer: { auth: authReducer, gigs: gigReducer, chat: chatReducer },
});
