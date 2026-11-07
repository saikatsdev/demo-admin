import { getDatas } from "../../../api/common/common";

const ENDPOINT = "/admin/supplier-ledgers";

export const getSupplierLedgers = (params = {}) => getDatas(ENDPOINT, params);
export const getSupplierLedgerStatement = (supplierId, params = {}) => getDatas(`${ENDPOINT}/${supplierId}`, params);
