import { deleteData, getDatas, postData, putData } from "../../../api/common/common";

const MATERIALS = "/admin/raw-materials";
const PURCHASES = "/admin/raw-material-purchases";

export const getRawMaterials    = (params = {}) => getDatas(MATERIALS, params);
export const getRawMaterialList = (params = {}) => getDatas(`${MATERIALS}/list`, params);
export const getRawMaterial     = (id) => getDatas(`${MATERIALS}/${id}`);
export const createRawMaterial  = (data) => postData(MATERIALS, data);
export const updateRawMaterial  = (id, data) => putData(`${MATERIALS}/${id}`, data);
export const deleteRawMaterial  = (id) => deleteData(`${MATERIALS}/${id}`);

export const getRawMaterialPurchases     = (params = {}) => getDatas(PURCHASES, params);
export const getRawMaterialPurchaseReport = (params = {}) => getDatas(`${PURCHASES}/report`, params);
export const getRawMaterialPurchase      = (id) => getDatas(`${PURCHASES}/${id}`);
export const createRawMaterialPurchase   = (data) => postData(PURCHASES, data);
export const updateRawMaterialPurchase   = (id, data) => putData(`${PURCHASES}/${id}`, data);
export const deleteRawMaterialPurchase   = (id) => deleteData(`${PURCHASES}/${id}`);
export const completeRawMaterialPurchase = (id) => postData(`${PURCHASES}/${id}/complete`, {});
