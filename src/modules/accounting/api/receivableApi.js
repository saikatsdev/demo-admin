import { getDatas } from "../../../api/common/common";

export const getReceivables         = (params = {}) => getDatas("/admin/receivables", params);
export const getReceivableStatement = (phoneNumber, params = {}) =>
    getDatas("/admin/receivables/statement/customer", {
        ...params,
        phone_number: phoneNumber,
    });
