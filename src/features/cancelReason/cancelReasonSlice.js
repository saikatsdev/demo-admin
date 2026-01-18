import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getDatas } from "../../api/common/common";

export const fetchCancelReasons = createAsyncThunk(
    "cancelReason/fetchCancelReasons",
    async () => {
        const res = await getDatas("/admin/cancel-reasons/list");
        return res?.result || [];
    }
);

const cancelReasonSlice = createSlice({
    name: "cancelReason",
    initialState: {
        list: [],
        loading: false,
    },
    extraReducers: (builder) => {
        builder
        .addCase(fetchCancelReasons.pending, (state) => {
            state.loading = true;
        })
        .addCase(fetchCancelReasons.fulfilled, (state, action) => {
            state.list = action.payload;
            state.loading = false;
        })
        .addCase(fetchCancelReasons.rejected, (state) => {
            state.loading = false;
        });
    },
});

export default cancelReasonSlice.reducer;
