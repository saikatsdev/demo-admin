import { deleteData, getDatas, postData, putData } from "../../../api/common/common";

const ENDPOINT = "/admin/stock-adjustments";

export const getStockAdjustments     = (params={}) => getDatas(ENDPOINT,params);
export const getStockAdjustment      = (id) => getDatas(`${ENDPOINT}/${id}`);
export const createStockAdjustment   = (data) => postData(ENDPOINT,data);
export const updateStockAdjustment   = (id,data) => putData(`${ENDPOINT}/${id}`,data);
export const completeStockAdjustment = (id) => postData(`${ENDPOINT}/${id}/complete`,{});
export const deleteStockAdjustment   = (id) => deleteData(`${ENDPOINT}/${id}`);
