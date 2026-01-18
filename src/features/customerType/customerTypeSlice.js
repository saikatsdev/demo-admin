import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getDatas } from "../../api/common/common";

export const fetchCustomerTypes = createAsyncThunk(
    "customerType/fetchCustomerTypes",
    async () => {
        const res = await getDatas("/admin/customer-types/list");
        return res?.result || [];
    }
);

const customerTypeSlice = createSlice({
    name: "customerType",
    initialState: {
        list: [],
        loading: false,
    },
    extraReducers: (builder) => {
        builder
        .addCase(fetchCustomerTypes.pending, (state) => {
            state.loading = true;
        })
        .addCase(fetchCustomerTypes.fulfilled, (state, action) => {
            state.list = action.payload;
            state.loading = false;
        })
        .addCase(fetchCustomerTypes.rejected, (state) => {
            state.loading = false;
        });
    },
});

export default customerTypeSlice.reducer;
