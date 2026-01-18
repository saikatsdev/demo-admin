import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getDatas } from "../../api/common/common";

export const fetchPaymentGateways = createAsyncThunk(
    "paymentGateway/fetchPaymentGateways",
    async () => {
        const res = await getDatas("/admin/payment-gateways/list");
        return res?.result || [];
    }
);

const paymentGatewaySlice = createSlice({
    name: "paymentGateway",
    initialState: {
        list: [],
        loading: false,
    },
    extraReducers: (builder) => {
        builder
        .addCase(fetchPaymentGateways.pending, (state) => {
            state.loading = true;
        })
        .addCase(fetchPaymentGateways.fulfilled, (state, action) => {
            state.list = action.payload;
            state.loading = false;
        })
        .addCase(fetchPaymentGateways.rejected, (state) => {
            state.loading = false;
        });
    },
});

export default paymentGatewaySlice.reducer;
