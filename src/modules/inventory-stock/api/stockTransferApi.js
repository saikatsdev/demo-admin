import {deleteData,getDatas,postData,putData} from "../../../api/common/common";

const E = "/admin/stock-transfers";

export const getStockTransfers = (p = {}) => getDatas(E, p);

export const getStockTransfer = (id) => getDatas(`${E}/${id}`);

export const createStockTransfer = (d) => postData(E, d);

export const updateStockTransfer = (id, d) => putData(`${E}/${id}`, d);

export const completeStockTransfer = (id) => postData(`${E}/${id}/complete`, {});

export const deleteStockTransfer = (id) => deleteData(`${E}/${id}`);