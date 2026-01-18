import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getDatas } from "../../api/common/common";

export const fetchDistricts = createAsyncThunk(
    "districts/fetchDistricts",
    async () => {
        const res = await getDatas("/admin/districts");
        return res.result?.data || [];
    }
);

const districtSlice = createSlice({
    name: "districts",
    initialState: {
        list: [],
        loading: false,
    },
    extraReducers: (builder) => {
        builder
        .addCase(fetchDistricts.pending, (state) => {
            state.loading = true;
        })
        .addCase(fetchDistricts.fulfilled, (state, action) => {
            state.list = action.payload;
            state.loading = false;
        })
        .addCase(fetchDistricts.rejected, (state) => {
            state.loading = false;
        });
    },
});

export default districtSlice.reducer;
