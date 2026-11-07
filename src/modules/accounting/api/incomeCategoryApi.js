import { deleteData, getDatas, postData, putData } from "../../../api/common/common";

const ENDPOINT = "/admin/income-categories";

export const getIncomeCategories   = (params = {}) => getDatas(ENDPOINT, params);
export const getIncomeCategoryList = () => getDatas(`${ENDPOINT}/list`);
export const createIncomeCategory  = (payload) => postData(ENDPOINT, payload);
export const updateIncomeCategory  = (id, payload) => putData(`${ENDPOINT}/${id}`, payload);
export const deleteIncomeCategory  = (id) => deleteData(`${ENDPOINT}/${id}`);
