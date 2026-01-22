import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/auth/authSlice';

import districtReducer from "./features/districts/districtSlice";
import orderFromReducer from "./features/orderFrom/orderFromSlice";
import customerTypeReducer from "./features/customerType/customerTypeSlice";
import cancelReasonReducer from "./features/cancelReason/cancelReasonSlice";
import paymentGatewayReducer from "./features/paymentGateway/paymentGatewaySlice";
import courierReducer from "./features/courier/courierSlice";
import statusReducer from "./features/status/statusSlice";
import deliveryGatewayReducer from "./features/deliveryGateway/deliveryGatewaySlice";

const PERSIST_KEY = 'auth';

const preloadedAuth = (() => {
  try {
    return JSON.parse(localStorage.getItem(PERSIST_KEY));
  } catch {
    return null;
  }
})();

export const store = configureStore({
  reducer: {
    auth: authReducer,
    districts: districtReducer,
    orderFrom: orderFromReducer,
    customerType: customerTypeReducer,
    cancelReason: cancelReasonReducer,
    paymentGateway: paymentGatewayReducer,
    courier: courierReducer,
    status: statusReducer,
    deliveryGateway: deliveryGatewayReducer,
  },
  preloadedState: preloadedAuth ? { auth: preloadedAuth } : undefined,
});

store.subscribe(() => {
  const { auth } = store.getState();
  localStorage.setItem(PERSIST_KEY, JSON.stringify(auth));
});
