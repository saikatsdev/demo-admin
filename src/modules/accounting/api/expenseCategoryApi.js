import { deleteData, getDatas, postData, putData } from "../../../api/common/common";

const ENDPOINT = "/admin/expense-categories";

export const getExpenseCategories   = (params = {}) => getDatas(ENDPOINT, params);
export const getExpenseCategoryList = () => getDatas(`${ENDPOINT}/list`);
export const getExpenseCategory     = (id) => getDatas(`${ENDPOINT}/${id}`);
export const createExpenseCategory  = (payload) => postData(ENDPOINT, payload);
export const updateExpenseCategory  = (id, payload) => putData(`${ENDPOINT}/${id}`, payload);
export const deleteExpenseCategory  = (id) => deleteData(`${ENDPOINT}/${id}`);
