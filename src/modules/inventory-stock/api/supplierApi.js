import { deleteData, getDatas, postData, putData } from "../../../api/common/common";

const SUPPLIER_ENDPOINT = "/admin/suppliers";

export const getSuppliers = (params = {}) => getDatas(SUPPLIER_ENDPOINT, params);

export const getSupplier = (id) => getDatas(`${SUPPLIER_ENDPOINT}/${id}`);

export const createSupplier = (payload) => postData(SUPPLIER_ENDPOINT, payload);

export const updateSupplier = (id, payload) => putData(`${SUPPLIER_ENDPOINT}/${id}`, payload);

export const deleteSupplier = (id) => deleteData(`${SUPPLIER_ENDPOINT}/${id}`);

export const getTrashedSuppliers = (params = {}) => getDatas(`${SUPPLIER_ENDPOINT}/trash`, params);

export const restoreSupplier = (id) => putData(`${SUPPLIER_ENDPOINT}/${id}/restore`);

export const permanentlyDeleteSupplier = (id) => deleteData(`${SUPPLIER_ENDPOINT}/${id}/permanent-delete`);
