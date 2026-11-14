import { getDatas } from "../../../api/common/common";

export const getChannelAccounts = () => getDatas("/admin/customer-inbox/channel-accounts");
