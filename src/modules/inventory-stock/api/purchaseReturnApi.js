import {deleteData,getDatas,postData,putData} from "../../../api/common/common";

const E = "/admin/purchase-returns";

export const getPurchaseReturns = (p = {}) => getDatas(E, p);

export const getPurchaseReturn = (id) => getDatas(`${E}/${id}`);

export const getReturnSource = (type, id) => getDatas(`${E}/source/${type}/${id}`);

export const createPurchaseReturn = (d) => postData(E, d);

export const updatePurchaseReturn = (id, d) => putData(`${E}/${id}`, d);

export const completePurchaseReturn = (id) => postData(`${E}/${id}/complete`, {});

export const deletePurchaseReturn = (id) => deleteData(`${E}/${id}`);