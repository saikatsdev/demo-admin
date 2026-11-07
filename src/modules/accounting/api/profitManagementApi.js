import { getDatas } from "../../../api/common/common";

const BASE = "/admin/profit-management";

export const getProfitSummary = (params = {}) => getDatas(`${BASE}/summary`, params);
export const getProfitTrend   = (params = {}) => getDatas(`${BASE}/trend`, params);
export const getOrderProfit   = (params = {}) => getDatas(`${BASE}/orders`, params);
export const getProductProfit = (params = {}) => getDatas(`${BASE}/products`, params);
