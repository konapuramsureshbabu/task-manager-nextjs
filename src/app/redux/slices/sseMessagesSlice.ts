import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SSEMessage {
  id: string;
  body: string;
  timestamp: string;
}

interface SSEMessagesState {
  messages: SSEMessage[];
}

const initialState: SSEMessagesState = {
  messages: [],
};

const sseMessagesSlice = createSlice({
  name: 'sseMessages',
  initialState,
  reducers: {
    addSSEMessage(state, action: PayloadAction<SSEMessage>) {
      state.messages.push(action.payload);
    },
    clearSSEMessages(state) {
      state.messages = [];
    },
  },
});

export const { addSSEMessage, clearSSEMessages } = sseMessagesSlice.actions;
export default sseMessagesSlice.reducer;