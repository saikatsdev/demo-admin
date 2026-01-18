import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getDatas } from "../../api/common/common";

export const fetchDeliveryGateways = createAsyncThunk(
    "deliveryGateway/fetchDeliveryGateways",
    async () => {
        const res = await getDatas("/admin/delivery-gateways/list");
        return res?.result || [];
    }
);

const deliveryGatewaySlice = createSlice({
    name: "deliveryGateway",
    initialState: {
        list: [],
        loading: false,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
        .addCase(fetchDeliveryGateways.pending, (state) => {
            state.loading = true;
        })
        .addCase(fetchDeliveryGateways.fulfilled, (state, action) => {
            state.list = action.payload;
            state.loading = false;
        })
        .addCase(fetchDeliveryGateways.rejected, (state) => {
            state.loading = false;
        });
    },
});

export default deliveryGatewaySlice.reducer;
