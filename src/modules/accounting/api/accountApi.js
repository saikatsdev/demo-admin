import { deleteData, getDatas, postData, putData } from "../../../api/common/common";

const ACCOUNT_ENDPOINT = "/admin/accounts";

export const getAccounts              = (params = {}) => getDatas(ACCOUNT_ENDPOINT, params);
export const getAccountList           = () => getDatas(`${ACCOUNT_ENDPOINT}/list`);
export const getAccount               = (id) => getDatas(`${ACCOUNT_ENDPOINT}/${id}`);
export const createAccount            = (payload) => postData(ACCOUNT_ENDPOINT, payload);
export const updateAccount            = (id, payload) => putData(`${ACCOUNT_ENDPOINT}/${id}`, payload);
export const deleteAccount            = (id) => deleteData(`${ACCOUNT_ENDPOINT}/${id}`);
export const getTrashedAccounts       = (params = {}) => getDatas(`${ACCOUNT_ENDPOINT}/trash`, params);
export const restoreAccount           = (id) => putData(`${ACCOUNT_ENDPOINT}/${id}/restore`);
export const permanentlyDeleteAccount = (id) => deleteData(`${ACCOUNT_ENDPOINT}/${id}/permanent-delete`);
