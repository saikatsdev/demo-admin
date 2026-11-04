import { getDatas } from "../../../api/common/common";

export const getStockOverview = (params = {}) => getDatas("/admin/stocks/overview", params);
export const getStockMovements = (params = {}) => getDatas("/admin/stocks/movements", params);
