import { deleteData, getDatas, postData, putData } from "../../../api/common/common";

const ENDPOINT = "/admin/incomes";

export const getIncomes              = (params = {}) => getDatas(ENDPOINT, params);
export const getIncomeSummary        = (params = {}) => getDatas(`${ENDPOINT}/summary`, params);
export const getIncome               = (id) => getDatas(`${ENDPOINT}/${id}`);
export const createIncome            = (payload) => postData(ENDPOINT, payload);
export const updateIncome            = (id, payload) => putData(`${ENDPOINT}/${id}`, payload);
export const deleteIncome            = (id) => deleteData(`${ENDPOINT}/${id}`);
export const getTrashedIncomes       = (params = {}) => getDatas(`${ENDPOINT}/trash`, params);
export const restoreIncome           = (id) => putData(`${ENDPOINT}/${id}/restore`);
export const permanentlyDeleteIncome = (id) => deleteData(`${ENDPOINT}/${id}/permanent-delete`);
