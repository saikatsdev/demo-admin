import { deleteData, getDatas, postData, putData } from "../../../api/common/common";

const WAREHOUSE_ENDPOINT = "/admin/warehouses";

export const getWarehouses              = (params = {}) => getDatas(WAREHOUSE_ENDPOINT, params);
export const getWarehouseList           = () => getDatas(`${WAREHOUSE_ENDPOINT}/list`);
export const getWarehouse               = (id) => getDatas(`${WAREHOUSE_ENDPOINT}/${id}`);
export const createWarehouse            = (payload) => postData(WAREHOUSE_ENDPOINT, payload);
export const updateWarehouse            = (id, payload) => putData(`${WAREHOUSE_ENDPOINT}/${id}`, payload);
export const deleteWarehouse            = (id) => deleteData(`${WAREHOUSE_ENDPOINT}/${id}`);
export const getTrashedWarehouses       = (params = {}) => getDatas(`${WAREHOUSE_ENDPOINT}/trash`, params);
export const restoreWarehouse           = (id) => putData(`${WAREHOUSE_ENDPOINT}/${id}/restore`);
export const permanentlyDeleteWarehouse = (id) => deleteData(`${WAREHOUSE_ENDPOINT}/${id}/permanent-delete`);
