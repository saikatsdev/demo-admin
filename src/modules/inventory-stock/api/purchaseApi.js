import { deleteData, getDatas, postData, putData } from "../../../api/common/common";

const PURCHASE_ENDPOINT = "/admin/purchases";

export const getPurchases              = (params = {}) => getDatas(PURCHASE_ENDPOINT, params);
export const getPurchase               = (id) => getDatas(`${PURCHASE_ENDPOINT}/${id}`);
export const createPurchase            = (payload) => postData(PURCHASE_ENDPOINT, payload);
export const updatePurchase            = (id, payload) => putData(`${PURCHASE_ENDPOINT}/${id}`, payload);
export const completePurchase          = (id) => postData(`${PURCHASE_ENDPOINT}/${id}/complete`, {});
export const deletePurchase            = (id) => deleteData(`${PURCHASE_ENDPOINT}/${id}`);
export const getTrashedPurchases       = (params = {}) => getDatas(`${PURCHASE_ENDPOINT}/trash`, params);
export const restorePurchase           = (id) => putData(`${PURCHASE_ENDPOINT}/${id}/restore`);
export const permanentlyDeletePurchase = (id) => deleteData(`${PURCHASE_ENDPOINT}/${id}/permanent-delete`);
export const searchPurchaseProducts    = (searchKey = "") => getDatas("/admin/products/search", { search_key: searchKey });
