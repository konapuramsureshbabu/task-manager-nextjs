import { configureStore } from '@reduxjs/toolkit';
import sseMessagesReducer from './slices/sseMessagesSlice'

export const store = configureStore({
  reducer: {
    sseMessages: sseMessagesReducer, 
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;