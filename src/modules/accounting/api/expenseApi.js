import { deleteData, getDatas, postData, putData } from "../../../api/common/common";

const EXPENSE_ENDPOINT = "/admin/expenses";

export const getExpenses               = (params = {}) => getDatas(EXPENSE_ENDPOINT, params);
export const getExpenseSummary         = (params = {}) => getDatas(`${EXPENSE_ENDPOINT}/summary`, params);
export const getExpense                = (id) => getDatas(`${EXPENSE_ENDPOINT}/${id}`);
export const createExpense             = (payload) => postData(EXPENSE_ENDPOINT, payload);
export const updateExpense             = (id, payload) => putData(`${EXPENSE_ENDPOINT}/${id}`, payload);
export const deleteExpense             = (id) => deleteData(`${EXPENSE_ENDPOINT}/${id}`);
export const getTrashedExpenses        = (params = {}) => getDatas(`${EXPENSE_ENDPOINT}/trash`, params);
export const restoreExpense            = (id) => putData(`${EXPENSE_ENDPOINT}/${id}/restore`);
export const permanentlyDeleteExpense  = (id) => deleteData(`${EXPENSE_ENDPOINT}/${id}/permanent-delete`);
