import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getDatas } from "../../api/common/common";

export const fetchStatuses = createAsyncThunk(
    "status/fetchStatuses",
    async () => {
        const res = await getDatas("/admin/statuses/list");
        return res?.result || [];
    }
);

const statusSlice = createSlice({
    name: "status",
    initialState: {
        list: [],
        loading: false,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
        .addCase(fetchStatuses.pending, (state) => {
            state.loading = true;
        })
        .addCase(fetchStatuses.fulfilled, (state, action) => {
            state.list = action.payload;
            state.loading = false;
        })
        .addCase(fetchStatuses.rejected, (state) => {
            state.loading = false;
        });
    },
});

export default statusSlice.reducer;
