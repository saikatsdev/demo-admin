import { getDatas } from "../../../api/common/common";

export const getPayables         = (params = {}) => getDatas("/admin/payables", params);
export const getPayableStatement = (supplierId, params = {}) =>getDatas(`/admin/payables/${supplierId}`, params);
