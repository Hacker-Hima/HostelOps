import { configureStore } from '@reduxjs/toolkit';
import assetOpsReducer from './ticketSlice';

export const store = configureStore({
  reducer: {
    ticketStore: assetOpsReducer,
    assetOps: assetOpsReducer,
  },
});