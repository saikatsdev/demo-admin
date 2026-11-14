import api from "../../../api";

const endpoint = "/admin/customer-inbox/telegram/bots";

export const getTelegramBots = (signal) => api.get(endpoint, { signal });
export const connectTelegramBot = (botToken) => api.post(endpoint, { bot_token: botToken });
