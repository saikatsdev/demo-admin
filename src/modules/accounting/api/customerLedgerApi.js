import { getDatas } from "../../../api/common/common";

export const getCustomerLedgers = (params = {}) => getDatas("/admin/customer-ledgers", params);

export const getCustomerLedgerStatement = (phoneNumber, params = {}) => getDatas("/admin/customer-ledgers/statement/customer", {...params,phone_number: phoneNumber});
