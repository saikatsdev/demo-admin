import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getDatas } from "../../api/common/common";

export const fetchOrderFromList = createAsyncThunk(
    "orderFrom/fetchOrderFromList",
    async () => {
        const res = await getDatas("/admin/order-froms/list");
        return res?.result || [];
    }
);

const orderFromSlice = createSlice({
    name: "orderFrom",
    initialState: {
        list: [],
        loading: false,
    },
    extraReducers: (builder) => {
        builder
        .addCase(fetchOrderFromList.pending, (state) => {
            state.loading = true;
        })
        .addCase(fetchOrderFromList.fulfilled, (state, action) => {
            state.list = action.payload;
            state.loading = false;
        })
        .addCase(fetchOrderFromList.rejected, (state) => {
            state.loading = false;
        });
    },
});

export default orderFromSlice.reducer;
