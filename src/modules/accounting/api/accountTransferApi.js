import { deleteData, getDatas, postData, putData } from "../../../api/common/common";

const ENDPOINT = "/admin/account-transfers";

export const getAccountTransfers              = (params = {}) => getDatas(ENDPOINT, params);
export const getAccountTransferSummary        = (params = {}) => getDatas(`${ENDPOINT}/summary`, params);
export const getAccountTransfer               = (id) => getDatas(`${ENDPOINT}/${id}`);
export const createAccountTransfer            = (payload) => postData(ENDPOINT, payload);
export const updateAccountTransfer            = (id, payload) => putData(`${ENDPOINT}/${id}`, payload);
export const deleteAccountTransfer            = (id) => deleteData(`${ENDPOINT}/${id}`);
export const getTrashedAccountTransfers       = (params = {}) => getDatas(`${ENDPOINT}/trash`, params);
export const restoreAccountTransfer           = (id) => putData(`${ENDPOINT}/${id}/restore`);
export const permanentlyDeleteAccountTransfer = (id) => deleteData(`${ENDPOINT}/${id}/permanent-delete`);
