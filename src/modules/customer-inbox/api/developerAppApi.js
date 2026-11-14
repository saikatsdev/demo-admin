import api from "../../../api";
import { getDatas, postData, putData } from "../../../api/common/common";

const endpoint = "/admin/customer-inbox/developer-apps";

export const startMessengerConnection      = () => postData("/admin/customer-inbox/messenger/connect", {});
export const connectMessengerWithPageToken = (token) => api.post("/admin/customer-inbox/messenger/connect-token", { page_access_token: token });
export const getMessengerSetup             = (signal) => api.get("/admin/customer-inbox/messenger/setup", { signal });
export const saveMessengerSetup            = (verifyToken) => api.put("/admin/customer-inbox/messenger/setup",verifyToken ? { verify_token: verifyToken } : {});

export const getDeveloperApps      = () => getDatas(endpoint);
export const getDeveloperAppSecret = (platform) => getDatas(`${endpoint}/${platform}/secret`);
export const saveDeveloperApp      = (platform, values) => putData(`${endpoint}/${platform}`, values);
