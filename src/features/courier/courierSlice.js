import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getDatas } from "../../api/common/common";

export const fetchCouriers = createAsyncThunk(
    "courier/fetchCouriers",
    async () => {
        const res = await getDatas("/admin/couriers/list");
        return res?.result || [];
    }
);

const courierSlice = createSlice({
    name: "courier",
    initialState: {
        list: [],
        loading: false,
        defaultCourierId: "",
    },
    reducers: {
        setCourierId: (state, action) => {
        state.defaultCourierId = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
        .addCase(fetchCouriers.pending, (state) => {
            state.loading = true;
        })
        .addCase(fetchCouriers.fulfilled, (state, action) => {
            state.list = action.payload;
            state.loading = false;

            const defaultCourier = state.list.find((c) => c.is_default === 1);
            state.defaultCourierId = defaultCourier ? defaultCourier.id : "";
        })
        .addCase(fetchCouriers.rejected, (state) => {
            state.loading = false;
        });
    },
});

export const { setCourierId } = courierSlice.actions;
export default courierSlice.reducer;
