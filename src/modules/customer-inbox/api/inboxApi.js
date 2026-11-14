import api from "../../../api";
import { deleteData, getDatas, postData, putData } from "../../../api/common/common";

const endpoint = "/admin/customer-inbox/conversations";

export const getQuickReplies  = (signal) => api.get(`${endpoint}/quick-replies`, { signal });
export const createQuickReply = (values) => api.post(`${endpoint}/quick-replies`, values);
export const updateQuickReply = (id, values) => api.put(`${endpoint}/quick-replies/${id}`, values);

export const getConversationMetadata          = (id, signal) => api.get(`${endpoint}/${id}/metadata`, { signal });
export const getConversationMetadataOptions   = (signal) => api.get(`${endpoint}/metadata/options`, { signal });
export const createConversationMetadataOption = (type, name) => api.post(`${endpoint}/metadata/options/${type}`, { name });
export const renameConversationMetadataOption = (type, id, name) => api.put(`${endpoint}/metadata/options/${type}/${id}`, { name });
export const deleteConversationMetadataOption = (type, id) => api.delete(`${endpoint}/metadata/options/${type}/${id}`);
export const saveConversationMetadata         = (id, fields) => api.put(`${endpoint}/${id}/metadata`, fields);
export const createConversationLabel          = (name) => api.post(`${endpoint}/labels`, { name });

export const getConversations         = (page, platform, search, unread, groupId) => getDatas(endpoint, { page, platform, search, unread: unread ? 1 : undefined, group_id: groupId });
export const getConversationGroups    = () => getDatas(`${endpoint}/groups`);
export const createConversationGroup  = (name, conversationIds = []) => postData(`${endpoint}/groups`, { name, conversation_ids: conversationIds });
export const deleteConversationGroup  = (id) => deleteData(`${endpoint}/groups/${id}`);
export const assignConversationGroup  = (id, groupId) => putData(`${endpoint}/${id}/group`, { group_id: groupId });
export const assignConversationGroups = (ids, groupId) => putData(`${endpoint}/groups/assign`, { conversation_ids: ids, group_id: groupId });

export const getMessages = async (id, beforeId, signal) => {
    const { data } = await api.get(`${endpoint}/${id}/messages`, { params: { before_id: beforeId }, signal });
    if (!data?.success || !Array.isArray(data.result?.data)) throw new Error("Unable to load messages.");
    return data.result;
};

export const getInboxImage = (platform, conversationId, messageId, signal) => api.get(
    `${endpoint}/${conversationId}/messages/${messageId}/${platform}-image`,
    { responseType: "blob", signal, timeout: 25000 },
);

export const markConversationRead = (id, messageId) => putData(`${endpoint}/${id}/read`, { message_id: messageId });
export const getConversationNotes = (id, page) => getDatas(`${endpoint}/${id}/notes`, { page });
export const addConversationNote  = (id, body) => postData(`${endpoint}/${id}/notes`, { body });

export const sendReply = (id, body, attachment) => {
    if (!attachment) return postData(`${endpoint}/${id}/messages`, { body });

    const form = new FormData();
    if (body) form.append("body", body);
    form.append("attachment", attachment.file);
    form.append("attachment_type", attachment.type);
    return postData(`${endpoint}/${id}/messages`, form, { timeout: 45000 });
};

export const setConversationTyping = (id, typing) => api.post(`${endpoint}/${id}/typing`, { typing }, { timeout: 6000 });
export const authorizeInbox        = (data) => api.post(`${endpoint}/realtime/auth`, data);
export const getLinkPreview        = (url, signal) => api.post("/admin/customer-inbox/link-preview", { url }, { signal, timeout: 15000 });
