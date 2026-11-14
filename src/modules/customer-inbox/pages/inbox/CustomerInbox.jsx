import { AppstoreOutlined, ArrowDownOutlined, BellOutlined, CheckSquareOutlined, CloseOutlined, CommentOutlined, DeleteOutlined, ExportOutlined, FacebookOutlined, FileImageOutlined, FileTextOutlined, FolderAddOutlined, InboxOutlined, InfoCircleOutlined, InstagramOutlined, LinkOutlined, PaperClipOutlined, SearchOutlined, SendOutlined, TikTokOutlined, UserOutlined, WhatsAppOutlined } from "@ant-design/icons";
import { Alert, Avatar, Button, Checkbox, Empty, Image, Input, Modal, Segmented, Select, Space, Spin, Typography, message } from "antd";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import Pusher from "pusher-js";
import { usePermission } from "../../../../hooks/usePermission";
import useTitle from "../../../../hooks/useTitle";
import { selectUser } from "../../../../features/auth/authSlice";
import { getChannelAccounts } from "../../api/channelAccountApi";
import { addConversationNote, assignConversationGroup, assignConversationGroups, authorizeInbox, createConversationGroup, deleteConversationGroup, getConversationGroups, getConversationNotes, getConversations, getInboxImage, getLinkPreview, markConversationRead, sendReply } from "../../api/inboxApi";
import useInboxPage from "../../hooks/useInboxPage";
import useInboxHistory from "../../hooks/useInboxHistory";
import ConversationMetadata from "./ConversationMetadata";
import QuickReplyPicker from "./QuickReplyPicker";
import useConversationTyping from "../../hooks/useConversationTyping";
import "../../styles/inbox.css";

const { Title, Text } = Typography;
const platforms = {
    all      : { name: "All", icon: AppstoreOutlined },
    messenger: { name: "Messenger", icon: FacebookOutlined },
    whatsapp : { name: "WhatsApp", icon: WhatsAppOutlined },
    instagram: { name: "Instagram", icon: InstagramOutlined },
    tiktok   : { name: "TikTok", icon: TikTokOutlined },
    telegram : { name: "Telegram", icon: SendOutlined },
};

const loadConversations = ({ platform, search, unread, group }, page) => getConversations(page, platform === "all" ? undefined : platform, search || undefined, unread, group === "all" ? undefined : group);
const loadGroupCandidates = (search, page) => getConversations(page, undefined, search || undefined);
const customerLabel = (conversation) => conversation.customer_name?.trim() || "Unknown customer";

function ConversationTime({ value }) {
    const date = new Date(value);
    const today = new Date();
    const format = date.toDateString() === today.toDateString()
        ? { hour: "numeric", minute: "2-digit" }
        : { month: "short", day: "numeric", ...(date.getFullYear() !== today.getFullYear() && { year: "numeric" }) };

    return <time dateTime={value} title={date.toLocaleString()}>{date.toLocaleString(undefined, format)}</time>;
}

const messagePreview = (message) => {
    if (!message) return "No messages yet";
    return `${message.direction === "outgoing" ? "You: " : ""}${message.body || "Attachment"}`;
};

function ImageAttachment({ url, alt = "Messenger image attachment" }) {
    const [failed, setFailed] = useState(false);

    if (failed) return <Text type="secondary">Image unavailable</Text>;

    return (
        <Image src={url} alt={alt} loading="lazy"
            referrerPolicy="no-referrer" onError={() => setFailed(true)}
        />
    );
}

function DraftImagePreview({ file, onRemove }) {
    const [url, setUrl] = useState(null);

    useEffect(() => {
        const preview = URL.createObjectURL(file);
        setUrl(preview);
        return () => URL.revokeObjectURL(preview);
    }, [file]);

    return (
        <div className="ci-draft-image">
            <div className="ci-draft-image-thumbnail">
                {url && <Image src={url} alt={file.name} width={88} height={72} />}
                <Button className="ci-draft-image-remove" htmlType="button" shape="circle" size="small"
                    icon={<CloseOutlined />} aria-label={`Remove ${file.name}`} onClick={onRemove} />
            </div>
            <span className="ci-draft-image-name" title={file.name}>{file.name}</span>
        </div>
    );
}

function InboxImageAttachment({ platform, conversationId, messageId }) {
    const [url, setUrl] = useState(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        const request = new AbortController();
        let objectUrl;
        getInboxImage(platform, conversationId, messageId, request.signal).then(({ data }) => {
            if (request.signal.aborted) return;
            objectUrl = URL.createObjectURL(data);
            setUrl(objectUrl);
        }).catch(() => {
            if (!request.signal.aborted) setFailed(true);
        });
        return () => {
            request.abort();
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [platform, conversationId, messageId]);

    if (failed) return <Text type="secondary">Image unavailable</Text>;
    if (!url) return <Text type="secondary" role="status">Loading image…</Text>;

    return <ImageAttachment url={url} alt={`${platforms[platform].name} image attachment`} />;
}

const messageUrlPattern = /(https?:\/\/[^\s<>"']+)/gi;

function webUrl(value) {
    if (typeof value !== "string" || !/^https?:\/\//i.test(value)) return null;
    try {
        const url = new URL(value);
        return url.username || url.password ? null : url;
    } catch {
        return null;
    }
}

function previewUrl(value) {
    const url = webUrl(value);
    if (url?.hostname === "l.facebook.com" && url.pathname === "/l.php") {
        return webUrl(url.searchParams.get("u")) ?? url;
    }
    return url;
}

function MessageText({ body }) {
    return (
        <div>
            {body.split(messageUrlPattern).map((part, index) => {
                if (index % 2 === 0) return part;
                const label = part.replace(/[.,!?;:]+$/, "");
                const url = webUrl(label);
                if (!url) return part;

                return (
                    <span key={index}>
                        <a className="ci-message-link" href={url.href} target="_blank" rel="noopener noreferrer">{label}</a>
                        {part.slice(label.length)}
                    </span>
                );
            })}
        </div>
    );
}

function LinkPreview({ url }) {
    const [thumbnailUnavailable, setThumbnailUnavailable] = useState(false);
    const [metadata, setMetadata] = useState(null);
    const host = url.hostname.replace(/^www\./, "");
    const [, section, pathId] = url.pathname.split("/");
    const videoId = host === "youtu.be" ? section : host === "youtube.com" || host === "m.youtube.com" ? url.searchParams.get("v") ?? (["shorts", "live", "embed"].includes(section) ? pathId : null) : null;
    const youtubeVideo = /^[\w-]{11}$/.test(videoId ?? "");
    const href = url.href;
    const thumbnail = youtubeVideo ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` : metadata?.image;

    useEffect(() => {
        if (youtubeVideo) return;
        const request = new AbortController();
        getLinkPreview(href, request.signal).then(({ data }) => {
            if (data?.success && !request.signal.aborted) setMetadata(data.result);
        }).catch(() => {});
        return () => request.abort();
    }, [href, youtubeVideo]);

    return (
        <a className="ci-message-link-card" href={url.href} target="_blank" rel="noopener noreferrer">
            {thumbnail && !thumbnailUnavailable && (
                <img className="ci-message-link-thumbnail" src={thumbnail}
                    alt="" width={320} height={180} loading="lazy" referrerPolicy="no-referrer"
                    onError={() => setThumbnailUnavailable(true)}
                />
            )}
            <span className="ci-message-link-card-details">
                <LinkOutlined aria-hidden="true" />
                <span>
                    <strong>{metadata?.title ?? (youtubeVideo ? "YouTube video" : host)}</strong>
                    {metadata?.description && <span className="ci-message-link-description">{metadata.description}</span>}
                    {(metadata?.title || youtubeVideo) && <small>{host}</small>}
                </span>
                <ExportOutlined aria-hidden="true" />
            </span>
        </a>
    );
}

function MessageContent({ item }) {
    const attachments = Array.isArray(item.attachments) ? item.attachments : [];
    const links = new Map();

    for (const value of item.body?.match(messageUrlPattern) ?? []) {
        const url = previewUrl(value.replace(/[.,!?;:]+$/, ""));
        if (url) links.set(url.href, url);
    }

    for (const attachment of attachments) {
        if (!["share", "link", "fallback"].includes(attachment?.type)) continue;
        const url = previewUrl(attachment?.payload?.url);
        if (url) links.set(url.href, url);
    }

    return (
        <>
            {item.body && <MessageText body={item.body} />}
            {attachments.length > 0 && (
                <div className="ci-inbox-attachments">
                    <Image.PreviewGroup>
                        {attachments.map((attachment, index) => {
                            const url = webUrl(attachment?.payload?.url);
                            if (attachment?.type === "image" && (attachment.payload?.media_id || attachment.payload?.telegram_file_id || attachment.payload?.messenger_image_path)) {
                                const platform = attachment.payload.telegram_file_id ? "telegram" : attachment.payload.messenger_image_path ? "messenger" : "whatsapp";
                                return <InboxImageAttachment key={index} platform={platform} conversationId={item.conversation_id} messageId={item.id} />;
                            }
                            if (attachment?.type === "image" && url?.protocol === "https:") {
                                return <ImageAttachment key={`${index}-${url.href}`} url={url.href} />;
                            }

                            if (links.size && ["share", "link", "fallback"].includes(attachment?.type)) {
                                return null;
                            }

                            if (attachment?.payload?.filename) {
                                return <Text key={index}><PaperClipOutlined /> {attachment.payload.filename}</Text>;
                            }

                            return <Text key={index} type="secondary">Attachment received</Text>;
                        })}
                    </Image.PreviewGroup>
                </div>
            )}
            {links.size > 0 && (
                <div className="ci-message-link-previews">
                    {Array.from(links.values(), (url) => <LinkPreview key={url.href} url={url} />)}
                </div>
            )}
            {!item.body && attachments.length === 0 && <div>Message</div>}
        </>
    );
}

function PlatformIcon({ platform }) {
    const Icon = platforms[platform]?.icon ?? CommentOutlined;
    return <span className={`ci-platform-icon ci-platform-icon--${platform}`} aria-hidden="true"><Icon /></span>;
}

function playNotificationSound(context) {
    if (context?.state !== "running") return;

    const time   = context.currentTime;
    const tone   = context.createOscillator();
    const volume = context.createGain();

    tone.frequency.setValueAtTime(660, time);
    tone.frequency.setValueAtTime(880, time + 0.08);
    volume.gain.setValueAtTime(0.12, time);
    volume.gain.exponentialRampToValueAtTime(0.001, time + 0.23);
    tone.connect(volume);
    volume.connect(context.destination);
    tone.start(time);
    tone.stop(time + 0.24);
}

function CustomerAvatar({ conversation, size = 24 }) {
    const initials = (conversation.customer_name?.trim() || "Customer")
        .split(/\s+/).slice(0, 2).map((part) => Array.from(part)[0]).join("").toUpperCase();

    return (
        <Avatar size={size} src={conversation.customer_profile_photo_url} imgProps={{ referrerPolicy: "no-referrer" }} aria-hidden="true">
            {initials}
        </Avatar>
    );
}

function ConversationMessage({ item, conversation, showSender }) {
    const outgoing = item.direction === "outgoing";
    const sender = outgoing ? (item.sender?.username?.trim() || "Business") : customerLabel(conversation);
    const date = item.sent_at ? new Date(item.sent_at) : null;

    return (
        <div className={`ci-message-row${outgoing ? " ci-message-row--outgoing" : ""}${showSender ? " ci-message-row--group-start" : ""}`} role="group" aria-label={`Message from ${sender}`}>
            <span className="ci-message-avatar" aria-hidden="true">
                {showSender && (outgoing
                    ? <Avatar className="ci-message-business-avatar" size={30} src={item.sender?.image} icon={<UserOutlined />} />
                    : <CustomerAvatar conversation={conversation} size={30} />)}
            </span>
            <div className="ci-message-stack">
                {showSender && <div className="ci-message-sender">{sender}</div>}
                <div className="ci-inbox-bubble">
                    <MessageContent item={item} />
                </div>
                <div className="ci-message-meta">
                    {date && (
                        <time dateTime={item.sent_at} title={date.toLocaleString()}>
                            {date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                        </time>
                    )}
                    {item.error && <Text type="danger" role="status">{item.error}</Text>}
                </div>
            </div>
        </div>
    );
}

function PageControls({ page, hasNext, onChange, nextLabel = "Next" }) {
    if (page === 1 && !hasNext) return null;

    return (
        <Space>
            <Button size="small" disabled={page === 1} onClick={() => onChange(page - 1)}>Previous</Button>
            <Button size="small" disabled={!hasNext} onClick={() => onChange(page + 1)}>{nextLabel}</Button>
        </Space>
    );
}

function GroupChatPicker({ selected, onToggle, disabled }) {
    const [input, setInput] = useState("");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const candidates = useInboxPage(loadGroupCandidates, true, search, page, 0);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setSearch(input.trim());
            setPage(1);
        }, 300);
        return () => window.clearTimeout(timer);
    }, [input]);

    return (
        <div className="ci-group-picker">
            <Text strong>Chats <Text type="secondary">(optional)</Text></Text>
            <Input aria-label="Search chats to add to the group" placeholder="Search by name or number" prefix={<SearchOutlined />}
                allowClear maxLength={100} disabled={disabled} value={input} onChange={(event) => setInput(event.target.value)} />
            <Text type="secondary" aria-live="polite">{selected.size} selected</Text>
            <div className="ci-group-picker-list" aria-label="Chats to add">
                {candidates.error && <Alert type="error" message="Unable to load chats." />}
                {!candidates.data && !candidates.error && <Spin size="small" />}
                {candidates.data?.data.length === 0 && <Text type="secondary">No matching chats</Text>}
                {candidates.data?.data.map((chat) => (
                    <Checkbox key={chat.id} checked={selected.has(chat.id)} disabled={disabled}
                        onChange={(event) => onToggle(chat.id, event.target.checked)}>
                        <span className="ci-group-picker-chat">
                            <CustomerAvatar conversation={chat} size={28} />
                            <span className="ci-group-picker-name">
                                <strong>{customerLabel(chat)}</strong>
                                <small>{chat.channel_account?.name ?? platforms[chat.channel_account?.platform]?.name}</small>
                            </span>
                        </span>
                    </Checkbox>
                ))}
            </div>
            <PageControls page={page} hasNext={Boolean(candidates.data?.next_page_url)} onChange={setPage} />
        </div>
    );
}

function ConversationNotes({ conversationId, revision }) {
    const [page, setPage] = useState(1);
    const notes = useInboxPage(getConversationNotes, true, conversationId, page, revision);

    return (
        <section className="ci-conversation-notes" aria-label="Internal notes">
            <Title level={5}>Internal notes</Title>
            {notes.error && <Alert type="error" showIcon message="Unable to load internal notes." />}
            {!notes.data && !notes.error && <Spin size="small" />}
            {notes.data?.data.length === 0 && <Text type="secondary">No internal notes yet.</Text>}
            {notes.data?.data.length > 0 && (
                <div className="ci-conversation-notes-list" key={page} role="region" aria-label="Saved internal notes" tabIndex={0}>
                    {notes.data.data.map((note) => (
                        <article className="ci-internal-note" key={note.id}>
                            <strong>{note.creator?.username || "Unknown user"}</strong>
                            {note.created_at && <time dateTime={note.created_at}>{new Date(note.created_at).toLocaleString()}</time>}
                            <p>{note.body}</p>
                        </article>
                    ))}
                </div>
            )}
            <PageControls page={page} hasNext={Boolean(notes.data?.next_page_url)} onChange={setPage} nextLabel="Older notes" />
        </section>
    );
}

export default function CustomerInbox() {
    useTitle("Customer Inbox");

    const user = useSelector(selectUser);
    const { can }                                 = usePermission();
    const canRead                                 = can("customer-inbox-read");
    const canUpdateGroups                         = canRead && can("customer-inbox-update");
    const [groups, setGroups]                     = useState(null);
    const [groupLoadError, setGroupLoadError]     = useState(false);
    const [groupFilter, setGroupFilter]           = useState("all");
    const [groupName, setGroupName]               = useState(null);
    const [newGroupChatIds, setNewGroupChatIds]   = useState(() => new Set());
    const [creatingGroup, setCreatingGroup]       = useState(false);
    const [groupToDelete, setGroupToDelete]       = useState(null);
    const [deletingGroup, setDeletingGroup]       = useState(false);
    const [assigningGroup, setAssigningGroup]     = useState(false);
    const [selectedChatIds, setSelectedChatIds]   = useState(null);
    const [bulkGroup, setBulkGroup]               = useState(null);
    const [assigningChats, setAssigningChats]     = useState(false);
    const [channels, setChannels]                 = useState(null);
    const [channelError, setChannelError]         = useState(false);
    const [revision, setRevision]                 = useState(0);
    const [selected, setSelected]                 = useState(null);
    const [conversationPage, setConversationPage] = useState(1);
    const [conversationTab, setConversationTab]   = useState("All");
    const [searchInput, setSearchInput]           = useState("");
    const [search, setSearch]                     = useState("");
    const [platform, setPlatform]                 = useState("all");
    const [reply, setReply]                       = useState("");
    const [quickReplyChat, setQuickReplyChat]     = useState(null);
    const [noteModeId, setNoteModeId]             = useState(null);
    const [noteDraft, setNoteDraft]               = useState(null);
    const [savingNote, setSavingNote]             = useState(false);
    const notesRequest                            = useRef(false);
    const [notesRevision, setNotesRevision]      = useState(0);
    const [attachmentDraft, setAttachmentDraft]    = useState(null);
    const [linkDraft, setLinkDraft]                = useState(null);
    const photoPicker                              = useRef(null);
    const filePicker                               = useRef(null);
    const [localReplies, setLocalReplies]         = useState([]);
    const replyQueue                              = useRef(Promise.resolve());
    const nextReplyId                             = useRef(0);
    const nextAttachmentId                        = useRef(0);
    const history                                 = useRef(null);
    const historyScroll                           = useRef(null);
    const olderAnchor                             = useRef(null);
    const [jumpConversationId, setJumpConversationId] = useState(null);
    const audio                                   = useRef(null);
    const soundMuted                              = useRef(false);
    const [soundEnabled, setSoundEnabled]         = useState(false);
    const [notice, noticeHolder]                  = message.useMessage();
    const unreadOnly                              = conversationTab === "Unread";
    const conversationFilters                     = useMemo(() => ({ platform, search, unread: unreadOnly, group: groupFilter }), [platform, search, unreadOnly, groupFilter]);
    const conversations                           = useInboxPage(loadConversations, canRead, conversationFilters, conversationPage, revision);
    const messages                                = useInboxHistory(canRead ? selected?.id : null, revision);
    const readThrough                             = useRef(new Map());
    const conversation                            = conversations.data?.data.find(({ id }) => id === selected?.id) ?? selected;
    const replyPlatform                           = conversation?.channel_account?.platform;
    const canReply                                = can("customer-inbox-messages-create") && ["messenger", "telegram", "whatsapp"].includes(replyPlatform);
    const canSendTyping                           = canRead && canReply;
    const typing                                  = useConversationTyping(canSendTyping ? conversation.id : null, replyPlatform);
    const connectedPlatforms                      = [...new Set((channels ?? []).map((channel) => channel.platform))].filter((key) => Object.hasOwn(platforms, key));
    const groupOptions = [
        { value: 0, label: "Ungrouped" },
        ...(groups ?? []).map(({ id, name }) => ({ value: id, label: name })),
    ];
    const filteredGroup = groups?.find(({ id }) => id === groupFilter);
    const selectingChats = canUpdateGroups && selectedChatIds !== null;
    const visibleChatIds = conversations.data?.data.map(({ id }) => id) ?? [];
    const checkedOnPage = selectingChats ? visibleChatIds.filter((id) => selectedChatIds.has(id)).length : 0;

    useEffect(() => {
        if (!canRead) return;
        let active = true;
        getConversationGroups().then((response) => {
            if (!active) return;
            if (!response?.success || !Array.isArray(response.result)) {
                setGroupLoadError(true);
                return;
            }
            setGroups(response.result);
            setGroupLoadError(false);
        }).catch(() => {
            if (active) setGroupLoadError(true);
        });
        return () => { active = false; };
    }, [canRead, revision]);

    useEffect(() => {
        const value = searchInput.trim();
        if (value === search) return;

        const timer = window.setTimeout(() => {
            setSearch(value);
            setConversationPage(1);
        }, value ? 300 : 0);

        return () => window.clearTimeout(timer);
    }, [searchInput, search]);

    const conversationId           = selected?.id;
    const canReadQuickReplies      = can("customer-inbox-saved-replies-read");
    const canCreateQuickReply      = can("customer-inbox-saved-replies-create");
    const canUpdateQuickReply      = can("customer-inbox-saved-replies-update");
    const canAddNote               = Boolean(conversationId) && can("customer-inbox-notes-create");
    const canViewNotes             = Boolean(conversationId) && can("customer-inbox-notes-read");
    const noteMode                 = canAddNote && (noteModeId === conversationId || !canReply);
    const noteBody                 = noteDraft && noteDraft.conversationId                              === conversationId ? noteDraft.body : "";
    const attachments              = canReply && attachmentDraft?.conversationId                        === conversationId ? attachmentDraft.items : [];
    const hasAttachments           = attachments.length > 0;
    const sendAttachmentSeparately = hasAttachments && replyPlatform                                    === "messenger";
    const link                     = canReply && !sendAttachmentSeparately && linkDraft?.conversationId === conversationId ? linkDraft : null;
    const replyLimit               = hasAttachments ? 1024 : 2000;
    const replyBody                = sendAttachmentSeparately ? "" : reply.trim();
    const newestIncomingId         = messages.history?.data.find((item) => item.direction === "incoming")?.id;
    const newestMessageId          = messages.history?.data[0]?.id;
    const visibleReplies           = localReplies.filter((item) => (item.conversationId === conversationId && (!item.serverId || item.serverId > (newestMessageId ?? 0))));
    const lastLocalReplyId         = visibleReplies.at(-1)?.id;
    const transcript = [
        ...(messages.history?.data.slice().reverse() ?? []),
        ...visibleReplies,
    ];

    useLayoutEffect(() => {
        const pane = history.current;
        if (!pane || !messages.history) return;

        const previous  = historyScroll.current;
        const opening   = previous?.id     !== conversationId || previous?.pane !== pane;
        const sentReply = lastLocalReplyId  != null && previous?.lastReplyId    !== lastLocalReplyId;
        const anchor    = olderAnchor.current;
        olderAnchor.current = null;

        if (opening || sentReply || (previous.nearBottom && !anchor)) {
            pane.scrollTop = pane.scrollHeight;
        } else if (anchor?.conversationId === conversationId && pane.contains(anchor.element)) {
            pane.scrollTop += anchor.element.getBoundingClientRect().top - anchor.top;
        }

        const nearBottom = pane.scrollHeight - pane.clientHeight - pane.scrollTop <= 64;

        historyScroll.current = {
            id: conversationId,
            pane,
            lastReplyId: lastLocalReplyId,
            nearBottom,
        };
        setJumpConversationId(nearBottom ? null : conversationId);
    }, [conversationId, messages.history, lastLocalReplyId]);

    const loadOlderMessages = () => {
        messages.loadOlder(() => {
            const element = history.current?.querySelector("[data-history-message]");
            if (element) olderAnchor.current = { conversationId, element, top: element.getBoundingClientRect().top };
        });
    };

    const onHistoryScroll = (event) => {
        const pane = event.currentTarget;
        const position = historyScroll.current;

        if (position?.id !== conversationId) return;

        position.nearBottom = pane.scrollHeight - pane.clientHeight - pane.scrollTop <= 64;

        setJumpConversationId(position.nearBottom ? null : conversationId);

        if (pane.scrollTop <= 80 && !position.nearBottom && !messages.older?.error) loadOlderMessages();
    };

    const jumpToLatest = () => {
        const pane = history.current;

        if (!pane) return;

        olderAnchor.current = null;

        if (historyScroll.current) {
            historyScroll.current.nearBottom = true;
        }

        pane.scrollTop = pane.scrollHeight;
        setJumpConversationId(null);
    };

    useEffect(() => {
        if (!canRead || !conversationId || !newestIncomingId) return;

        const attempts = readThrough.current;

        if ((attempts.get(conversationId) ?? 0) >= newestIncomingId) return;

        attempts.set(conversationId, newestIncomingId);

        const allowRetry = () => {
            if (attempts.get(conversationId) === newestIncomingId) attempts.delete(conversationId);
        };

        markConversationRead(conversationId, newestIncomingId).then((response) => {
            if (response?.success) {
                setRevision((value) => value + 1);
            }else{
                allowRetry();   
            }
        }).catch(allowRetry);
    }, [canRead, conversationId, newestIncomingId, revision]);

    const selectPlatform = (key) => {
        if (key === platform) return;

        setPlatform(key);

        setConversationPage(1);

        if (key !== "all" && selected?.channel_account?.platform !== key) {
            setSelected(null);
            setReply("");
        }
    };

    const saveGroup = async () => {
        const name = groupName?.trim();

        if (!name || creatingGroup || !canUpdateGroups) return;

        setCreatingGroup(true);

        try {
            const response = await createConversationGroup(name, [...newGroupChatIds]);
            if (!response?.success || !response.result?.id) {
                notice.error(response?.message || "Unable to create the conversation group.");
                return;
            }

            const groupId = response.result.id;

            setSelected((current) => newGroupChatIds.has(current?.id) ? { ...current, conversation_group_id: groupId } : current);

            setGroupName(null);
            
            setRevision((value) => value + 1);
            notice.success("Conversation group saved.");
        } catch {
            notice.error("Unable to create the conversation group.");
        } finally {
            setCreatingGroup(false);
        }
    };

    const confirmDeleteGroup = async () => {
        if (!groupToDelete || !canUpdateGroups || deletingGroup) return;
        const { id } = groupToDelete;
        setDeletingGroup(true);
        try {
            const response = await deleteConversationGroup(id);

            if (!response?.success) {
                notice.error(response?.message || "Unable to delete the conversation group.");
                return;
            }

            setGroups((current) => current?.filter((group) => group.id !== id) ?? null);
            setSelected((current) => current?.conversation_group_id === id ? { ...current, conversation_group_id: null } : current);
            setGroupFilter((current) => current === id ? "all" : current);
            setBulkGroup((current) => current === id ? null : current);
            setConversationPage(1);
            setGroupToDelete(null);
            setRevision((value) => value + 1);
            notice.success("Group deleted. Its chats are now ungrouped.");
        } catch {
            notice.error("Unable to delete the conversation group.");
        } finally {
            setDeletingGroup(false);
        }
    };

    const updateConversationGroup = async (groupId) => {
        const id = selected?.id;
        if (!id || assigningGroup || !canUpdateGroups) return;
        setAssigningGroup(true);
        try {
            const response = await assignConversationGroup(id, groupId || null);
            if (!response?.success) {
                notice.error(response?.message || "Unable to update the conversation group.");
                return;
            }
            setSelected((current) => current?.id === id ? { ...current, ...response.result } : current);
            setRevision((value) => value + 1);
        } catch {
            notice.error("Unable to update the conversation group.");
        } finally {
            setAssigningGroup(false);
        }
    };

    const toggleChatSelection = (ids, checked) => {
        setSelectedChatIds((current) => {
            if (!current) return current;
            const next = new Set(current);
            for (const id of ids) {
                if (checked) {
                    next.add(id);
                }else{
                    next.delete(id);
                }
            }
            return next;
        });
    };

    const assignSelectedChats = async () => {
        if (!selectingChats || !selectedChatIds.size || bulkGroup === null || assigningChats) return;

        setAssigningChats(true);

        try {
            const response = await assignConversationGroups([...selectedChatIds], bulkGroup);

            if (!response?.success) {
                notice.error(response?.message || "Unable to move the selected conversations.");
                return;
            }

            setSelected((current) => selectedChatIds.has(current?.id) ? { ...current, ...response.result } : current);
            setSelectedChatIds(null);
            setBulkGroup(null);
            setRevision((value) => value + 1);
            notice.success(`Moved ${selectedChatIds.size} conversation${selectedChatIds.size === 1 ? "" : "s"}.`);
        } catch {
            notice.error("Unable to move the selected conversations.");
        } finally {
            setAssigningChats(false);
        }
    };

    const toggleSound = async () => {
        try {
            audio.current ??= new AudioContext();
            if (soundEnabled) {
                soundMuted.current = true;
                await audio.current.suspend();
                setSoundEnabled(false);
            } else {
                soundMuted.current = false;
                await audio.current.resume();
                setSoundEnabled(true);
                playNotificationSound(audio.current);
            }
        } catch {
            notice.error("Unable to enable notification sound in this browser.");
        }
    };

    useEffect(() => {
        if (!canRead) return;

        const unlockSound = (event) => {
            if (soundMuted.current || event.target?.closest?.("[data-inbox-sound-toggle]")) return;
            if (!window.AudioContext || audio.current?.state === "running") return;
            audio.current ??= new AudioContext();
            const context = audio.current;
            void context.resume().then(() => {
                if (audio.current === context && !soundMuted.current) setSoundEnabled(context.state === "running");
            }).catch(() => {});
        };

        window.addEventListener("click", unlockSound);
        window.addEventListener("keydown", unlockSound);
        return () => {
            window.removeEventListener("click", unlockSound);
            window.removeEventListener("keydown", unlockSound);
            const context = audio.current;
            audio.current = null;
            if (context && context.state !== "closed") void context.close();
        };
    }, [canRead]);

    useEffect(() => {
        if (!canRead) return;

        const refresh = () => setRevision((value) => value + 1);
        const timer   = window.setInterval(refresh, 15000);
        const key     = import.meta.env.VITE_PUSHER_APP_KEY;
        const cluster = import.meta.env.VITE_PUSHER_APP_CLUSTER;
        const client = key && cluster ? new Pusher(key, {
            cluster,
            forceTLS: true,
            channelAuthorization: {
                customHandler: (params, callback) => {
                    authorizeInbox({ channel_name: params.channelName, socket_id: params.socketId })
                        .then(({ data }) => callback(null, data))
                        .catch((error) => callback(error, null));
                },
            },
        }) : null;
        const channel = client?.subscribe("private-customer-inbox");
        channel?.bind("inbox.changed", refresh);
        channel?.bind("inbox.message.received", () => {
            refresh();
            notice.info({ content: "New customer message", key: "customer-inbox-incoming" });
            playNotificationSound(audio.current);
        });
        channel?.bind("pusher:subscription_succeeded", refresh);

        return () => {
            window.clearInterval(timer);
            client?.disconnect();
        };
    }, [canRead, notice]);

    const selectAttachment = (event, type) => {
        const files = Array.from(event.target.files ?? []);
        event.target.value = "";
        if (!files.length) return;

        const limit = type === "image" ? (replyPlatform === "whatsapp" ? 5 : 10) : 20;
        const oversized = files.find((file) => file.size > limit * 1024 * 1024 || !file.size);
        if (oversized) {
            notice.error(`${oversized.name}: choose a non-empty file up to ${limit} MB.`);
            return;
        }
        if (type === "image" && files.some((file) => file.type && !["image/jpeg", "image/png"].includes(file.type))) {
            notice.error("Choose a JPEG or PNG image.");
            return;
        }
        if (type === "file" && replyPlatform === "whatsapp" && !/\.(pdf|txt|docx?|xlsx?|pptx?)$/i.test(files[0].name)) {
            notice.error("Choose a PDF, text, Word, Excel, or PowerPoint file.");
            return;
        }
        const selectedFiles = files.map((file) => ({ id: ++nextAttachmentId.current, type, file }));
        setAttachmentDraft((current) => {
            const previous = type === "image" && current?.conversationId === conversationId && current.items[0]?.type === "image"
                ? current.items
                : [];
            return { conversationId, items: [...previous, ...selectedFiles] };
        });
    };

    const removeAttachment = (id) => {
        setAttachmentDraft((current) => {
            if (!current) return null;
            const items = current.items.filter((item) => item.id !== id);
            return items.length ? { ...current, items } : null;
        });
    };

    const insertLink = () => {
        const url = webUrl(link?.value.trim());
        if (!url) {
            notice.error("Enter a valid HTTP or HTTPS link.");
            return;
        }
        const body = [reply.trim(), url.href].filter(Boolean).join("\n");
        if (Array.from(body).length > replyLimit) {
            notice.error(`Keep the message within ${replyLimit} characters.`);
            return;
        }
        setReply(body);
        setLinkDraft(null);
    };

    const submitNote = async (event) => {
        event.preventDefault();
        if (!canAddNote || !noteBody.trim() || notesRequest.current) return;
        notesRequest.current = true;
        setSavingNote(true);
        try {
            const response = await addConversationNote(conversationId, noteBody.trim());
            if (!response?.success) {
                notice.error(response?.message || "Unable to save the internal note.");
                return;
            }
            setNoteDraft((current) => current === noteDraft ? null : current);
            setNotesRevision((value) => value + 1);
            notice.success("Internal note saved.");
        } catch {
            notice.error("Unable to save the internal note.");
        } finally {
            notesRequest.current = false;
            setSavingNote(false);
        }
    };

    const submitReply = (event) => {
        event.preventDefault();
        const body = replyBody;
        if (!canReply || (!body && !hasAttachments) || Array.from(body).length > replyLimit) return;
        typing.stop();

        const conversationId = conversation.id;
        const sentAt = new Date().toISOString();
        const jobs = (hasAttachments ? attachments : [null]).map((attachment, index) => ({
            attachment,
            item: {
                id: ++nextReplyId.current, conversationId, body: index === 0 ? body : "",
                direction: "outgoing", sent_at: sentAt, local: true,
                sender_user_id: user?.id ?? null,
                sender: { username: user?.username, image: user?.image },
                attachments: attachment ? [{ type: attachment.type, payload: { filename: attachment.file.name } }] : [],
            },
        }));
        setLocalReplies((items) => [
            ...items.filter((item) => item.conversationId !== conversationId || !item.serverId || item.serverId > (newestMessageId ?? 0)),
            ...jobs.map(({ item }) => item),
        ]);
        if (!sendAttachmentSeparately) setReply("");
        setAttachmentDraft(null);
        setLinkDraft(null);

        const updateLocalReply = (id, changes) => {
            setLocalReplies((items) => items.map((item) => item.id === id ? { ...item, ...changes } : item));
        };

        replyQueue.current = replyQueue.current.then(async () => {
            for (const { item, attachment } of jobs) {
                try {
                    const response = await sendReply(conversationId, item.body, attachment);
                    if (!response?.success || !response.result?.id) {
                        updateLocalReply(item.id, { error: response?.message || "Unable to confirm the reply." });
                        continue;
                    }
                    updateLocalReply(item.id, { serverId: response.result.id });
                    setRevision((value) => value + 1);
                } catch {
                    updateLocalReply(item.id, { error: "Unable to confirm the reply." });
                }
            }
        });
    };

    useEffect(() => {
        if (!canRead) return;
        let active = true;
        getChannelAccounts().then((response) => {
            if (!active) return;
            if (response?.success && Array.isArray(response.result)) setChannels(response.result);
            else setChannelError(true);
        }).catch(() => {
            if (active) setChannelError(true);
        });
        return () => { active = false; };
    }, [canRead]);

    if (!canRead) {
        return <Alert type="error" showIcon message="You do not have permission to view the inbox." />;
    }

    return (
        <div className="ci-inbox">
            {noticeHolder}
            <Modal title={groupToDelete ? `Delete “${groupToDelete.name}”?` : "Delete group"}
                open={Boolean(groupToDelete)} onCancel={() => setGroupToDelete(null)} onOk={confirmDeleteGroup}
                okText="Delete group" okButtonProps={{ danger: true }} confirmLoading={deletingGroup}
                cancelButtonProps={{ disabled: deletingGroup }} closable={!deletingGroup} keyboard={!deletingGroup} maskClosable={!deletingGroup}>
                <Text>Chats in this group will move to Ungrouped. Their message history will stay in the Inbox.</Text>
            </Modal>
            <Modal title="Create group" open={groupName !== null} onCancel={() => setGroupName(null)}
                onOk={saveGroup} okText="Create group" confirmLoading={creatingGroup}
                okButtonProps={{ disabled: !groupName?.trim() }} cancelButtonProps={{ disabled: creatingGroup }}
                closable={!creatingGroup} keyboard={!creatingGroup} maskClosable={!creatingGroup}>
                <Input aria-label="Group name" placeholder="Group name" maxLength={80} value={groupName ?? ""} disabled={creatingGroup}
                    onChange={(event) => setGroupName(event.target.value)} />
                {groupName !== null && <GroupChatPicker selected={newGroupChatIds} disabled={creatingGroup} onToggle={(id, checked) => {
                    setNewGroupChatIds((current) => {
                        const next = new Set(current);
                        if (checked) next.add(id);
                        else next.delete(id);
                        return next;
                    });
                }} />}
            </Modal>
            <header className="ci-inbox-heading">
                <div className="ci-inbox-title">
                    <span className="ci-inbox-title-icon" aria-hidden="true"><InboxOutlined /></span>
                    <Title level={2}>Customer Inbox</Title>
                </div>
                <Button className="ci-sound-button" icon={<BellOutlined />} aria-pressed={soundEnabled} onClick={toggleSound} data-inbox-sound-toggle>
                    {soundEnabled ? "Sound on" : "Enable sound"}
                </Button>
            </header>

            <div className="ci-inbox-layout">
                <section className="ci-inbox-pane ci-inbox-list" aria-labelledby="ci-conversations">
                    <header className="ci-inbox-pane-header">
                        <Title level={4} id="ci-conversations">Chats</Title>

                        <Input className="ci-chat-search" prefix={<SearchOutlined />} placeholder="Search conversations"
                            aria-label="Search conversations by customer name or number" allowClear maxLength={100}
                            value={searchInput} onChange={(event) => setSearchInput(event.target.value)} />

                        <div className="ci-platform-filters" role="group" aria-label="Filter chats by platform">
                            {["all", ...connectedPlatforms].map((key) => (
                                <button key={key} type="button" className="ci-platform-filter" aria-pressed={platform === key} onClick={() => selectPlatform(key)}>
                                    <PlatformIcon platform={key} />
                                    {platforms[key].name}
                                </button>
                            ))}
                        </div>

                        {channelError && 
                            <Text type="danger">
                                Unable to load connected channels.
                            </Text>
                        }

                        {!channelError && !channels && 
                            <Spin size="small" aria-label="Loading connected channels" />
                        }

                        <div className="ci-group-controls">
                            <Select aria-label="Filter conversations by group" value={groupFilter} disabled={!groups} loading={!groups && !groupLoadError}
                                options={[{ value: "all", label: "All groups" }, ...groupOptions]}
                                onChange={(value) => { setGroupFilter(value); setConversationPage(1); }} />
                            {canUpdateGroups && <Button icon={<FolderAddOutlined />} disabled={!groups} onClick={() => {
                                setNewGroupChatIds(new Set());
                                setGroupName("");
                            }}>Create group</Button>}
                        </div>
                        {groupLoadError && !groups && <Text type="secondary">Unable to load groups.</Text>}
                        {canUpdateGroups && (
                            <div className="ci-group-actions">
                                <Button type="text" size="small" icon={selectingChats ? <CloseOutlined /> : <CheckSquareOutlined />}
                                    disabled={!groups?.length || assigningChats} onClick={() => {
                                        setSelectedChatIds(selectingChats ? null : new Set());
                                        setBulkGroup(null);
                                    }}>{selectingChats ? "Cancel selection" : "Select chats"}</Button>
                                {filteredGroup && (
                                    <Button type="text" danger size="small" icon={<DeleteOutlined />} disabled={assigningChats || assigningGroup}
                                        onClick={() => setGroupToDelete(filteredGroup)}>Delete group</Button>
                                )}
                            </div>
                        )}
                        {selectingChats && (
                            <div className="ci-bulk-group-controls">
                                <div className="ci-bulk-group-summary">
                                    <Checkbox disabled={assigningChats || !visibleChatIds.length}
                                        checked={visibleChatIds.length > 0 && checkedOnPage === visibleChatIds.length}
                                        indeterminate={checkedOnPage > 0 && checkedOnPage < visibleChatIds.length}
                                        onChange={(event) => toggleChatSelection(visibleChatIds, event.target.checked)}>
                                        Select this page
                                    </Checkbox>
                                    <Text type="secondary" aria-live="polite">{selectedChatIds.size} selected</Text>
                                </div>
                                <div className="ci-group-controls">
                                    <Select aria-label="Destination group" placeholder="Choose group" value={bulkGroup}
                                        options={groupOptions.slice(1)} disabled={assigningChats} onChange={setBulkGroup} />
                                    <Button size="small" type="primary" onClick={assignSelectedChats} loading={assigningChats}
                                        disabled={!selectedChatIds.size || bulkGroup === null}>Move to group</Button>
                                </div>
                            </div>
                        )}

                        <Segmented className="ci-read-filter" block options={["All", "Unread"]} value={conversationTab} aria-label="Conversation read status" onChange={(tab) => {
                            setConversationTab(tab);
                            setConversationPage(1);
                        }} />
                    </header>

                    <div className="ci-inbox-records">
                        {conversations.error && 
                            <Alert type="error" message="Unable to load conversations." />
                        }

                        {!conversations.data && !conversations.error && 
                            <Spin size="small" />
                        }

                        {conversations.data?.data.length === 0 && 
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={search ? "No matching conversations" : unreadOnly ? "No unread conversations" : "No conversations yet"} />
                        }

                        {conversations.data?.data.map((item) => (
                            <div className={selectingChats ? "ci-chat-row-selection" : undefined} key={item.id}>
                                {selectingChats && <Checkbox aria-label={`Select chat with ${customerLabel(item)}`}
                                    checked={selectedChatIds.has(item.id)} disabled={assigningChats}
                                    onChange={(event) => toggleChatSelection([item.id], event.target.checked)} />}
                                <button type="button" className={`ci-chat-row${item.unread_count > 0 ? " ci-chat-row--unread" : ""}`}
                                    aria-current={item.id === selected?.id ? "true" : undefined}
                                    aria-pressed={selectingChats ? selectedChatIds.has(item.id) : undefined}
                                    disabled={selectingChats && assigningChats}
                                    onClick={() => {
                                        if (selectingChats) {
                                            toggleChatSelection([item.id], !selectedChatIds.has(item.id));
                                            return;
                                        }
                                        setSelected(item);
                                        setReply("");
                                    }}
                                >
                                    <span className="ci-chat-avatar">
                                        <CustomerAvatar conversation={item} size={46} />
                                        <PlatformIcon platform={item.channel_account?.platform} />
                                    </span>

                                    <span className="ci-chat-row-copy">
                                        <span className="ci-chat-row-heading">
                                            <strong title={customerLabel(item)}>{customerLabel(item)}</strong>
                                            {item.last_message_at && <ConversationTime value={item.last_message_at} />}
                                        </span>

                                        <span className="ci-chat-row-preview" title={messagePreview(item.latest_message)}>
                                            {messagePreview(item.latest_message)}
                                        </span>

                                        <span className="ci-chat-row-meta">
                                            <span>
                                                {item.channel_account?.name ?? platforms[item.channel_account?.platform]?.name}
                                            </span>

                                            <span>
                                                {item.messages_count} {item.messages_count === 1 ? "message" : "messages"}
                                            </span>
                                        </span>
                                    </span>
                                    {item.unread_count > 0 && (
                                        <span className="ci-chat-row-unread" aria-label={`${item.unread_count} unread messages`}>
                                            {item.unread_count > 99 ? "99+" : item.unread_count}
                                        </span>
                                    )}
                                </button>
                            </div>
                        ))}
                        <PageControls page={conversationPage} hasNext={Boolean(conversations.data?.next_page_url)} onChange={setConversationPage} />
                    </div>
                </section>

                <section className="ci-inbox-pane ci-inbox-chat" aria-labelledby="ci-chat">
                    <header className="ci-inbox-pane-header ci-chat-header">
                        {conversation ? (
                            <div className="ci-chat-identity">
                                <CustomerAvatar conversation={conversation} size={40} />
                                <div className="ci-chat-identity-text">
                                    <Title level={5} id="ci-chat">{customerLabel(conversation)}</Title>
                                    <span className="ci-chat-channel">
                                        <PlatformIcon platform={replyPlatform} />
                                        {conversation.channel_account?.name ?? platforms[replyPlatform]?.name}
                                    </span>
                                </div>
                            </div>
                        ) : <Title level={5} id="ci-chat">Conversation</Title>}
                    </header>
                    {conversation ? (
                        <div className="ci-history-frame">
                            <div className="ci-inbox-history" ref={history} onScroll={onHistoryScroll}>
                                {messages.history?.hasOlder && (
                                    <div className="ci-history-older">
                                        <Button size="small" loading={messages.older?.loading} onClick={loadOlderMessages}>
                                            {messages.older?.error ? "Retry loading older messages" : "Load older messages"}
                                        </Button>
                                    </div>
                                )}
                                {messages.error && <Alert type="error" message="Unable to load messages." />}
                                {!messages.history && !messages.error && <Spin size="small" />}
                                {messages.history?.data.length === 0 && <Text type="secondary">No messages yet.</Text>}
                                {transcript.map((item, index) => {
                                    const previous = transcript[index - 1];
                                    const date = item.sent_at ? new Date(item.sent_at) : null;
                                    const newDay = date && date.toDateString() !== new Date(previous?.sent_at ?? NaN).toDateString();
                                    const showSender = newDay || previous?.direction !== item.direction
                                        || previous?.sender_user_id !== item.sender_user_id;
                                    return (
                                        <div className="ci-transcript-item" data-history-message={item.local ? undefined : item.id} key={item.local ? `local-${item.id}` : item.id}>
                                            {newDay && <div className="ci-message-date">{date.toLocaleDateString(undefined, { dateStyle: "medium" })}</div>}
                                            <ConversationMessage item={item} conversation={conversation} showSender={showSender} />
                                        </div>
                                    );
                                })}
                            </div>
                            {messages.history && jumpConversationId === conversationId && (
                                <Button className="ci-history-jump" shape="circle" icon={<ArrowDownOutlined />}
                                    aria-label="Jump to latest messages" title="Jump to latest messages" onClick={jumpToLatest} />
                            )}
                        </div>
                    ) : <div className="ci-inbox-empty ci-inbox-chat-empty">
                        <span className="ci-inbox-empty-icon" aria-hidden="true"><CommentOutlined /></span>
                        <Title level={4}>Select a conversation</Title>
                        <Text type="secondary">Choose a conversation to read messages and reply.</Text>
                    </div>}
                    <form className={`ci-inbox-composer${noteMode ? " ci-inbox-composer--note" : ""}`} onSubmit={noteMode ? submitNote : submitReply}>
                        <Segmented
                            aria-label="Message type"
                            options={[
                                { label: "Reply", value: "reply", icon: <CommentOutlined />, disabled: !canReply },
                                { label: "Internal note", value: "note", icon: <FileTextOutlined />, disabled: !canAddNote },
                            ]}
                            value={noteMode ? "note" : "reply"}
                            onChange={(value) => {
                                typing.stop();
                                setNoteModeId(value === "note" ? conversationId : null);
                            }}
                        />
                        {noteMode ? (
                            <>
                                <Text type="secondary">Visible to staff with access to internal notes.</Text>
                                <Input.TextArea rows={2} maxLength={2000} placeholder="Write an internal note" aria-label="Internal note"
                                    value={noteBody} onChange={(event) => setNoteDraft({ conversationId, body: event.target.value })} />
                                <div className="ci-composer-actions">
                                    <Button htmlType="submit" type="primary" loading={savingNote} disabled={!noteBody.trim()}>Save note</Button>
                                </div>
                            </>
                        ) : (
                            <>
                                <Input.TextArea rows={2} maxLength={replyLimit} placeholder={canReply ? (hasAttachments ? "Add a caption (optional)" : "Write a reply") : "Reply unavailable"}
                                    aria-label="Reply" disabled={!canReply || sendAttachmentSeparately} value={reply} onBlur={typing.stop} onKeyDown={(event) => {
                                        if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing || event.keyCode === 229) return;
                                        event.preventDefault();
                                        if (!event.repeat) event.currentTarget.form?.requestSubmit();
                                    }} onChange={(event) => {
                                        setReply(event.target.value);
                                        typing.update(event.target.value);
                                    }} />
                                {attachments[0]?.type === "image" && (
                                    <div className="ci-draft-images" aria-label="Selected images">
                                        <Image.PreviewGroup>
                                            {attachments.map(({ id, file }) => <DraftImagePreview key={id} file={file} onRemove={() => removeAttachment(id)} />)}
                                        </Image.PreviewGroup>
                                    </div>
                                )}
                                {attachments.filter(({ type }) => type === "file").map((attachment) => (
                                    <div className="ci-reply-attachment" key={attachment.id}>
                                        <Text ellipsis title={attachment.file.name}>{attachment.file.name}</Text>
                                        <Button htmlType="button" type="link" size="small" aria-label={`Remove ${attachment.file.name}`}
                                            onClick={() => removeAttachment(attachment.id)}>Remove</Button>
                                    </div>
                                ))}
                                {attachments.length > 1 && !sendAttachmentSeparately && <Text type="secondary">The caption goes with the first image.</Text>}
                                {sendAttachmentSeparately && <Text type="secondary">Send any text or links as a separate reply in Messenger.</Text>}
                                {link && (
                                    <Space.Compact className="ci-reply-link">
                                        <Input aria-label="Link URL" placeholder="https://example.com" value={link.value}
                                            onChange={(event) => setLinkDraft({ conversationId, value: event.target.value })}
                                            onPressEnter={(event) => { event.preventDefault(); insertLink(); }} />
                                        <Button htmlType="button" onClick={insertLink}>Insert</Button>
                                    </Space.Compact>
                                )}
                                <div className="ci-composer-actions">
                                    {canReply && (
                                        <Space size={6} wrap>
                                            {(canReadQuickReplies || canCreateQuickReply) && (
                                                <Button htmlType="button" icon={<CommentOutlined />} disabled={sendAttachmentSeparately}
                                                    onClick={() => setQuickReplyChat(conversationId)}>Quick Reply</Button>
                                            )}
                                            <input ref={photoPicker} type="file" accept="image/jpeg,image/png" multiple hidden onChange={(event) => selectAttachment(event, "image")} />
                                            <input ref={filePicker} type="file" accept={replyPlatform === "whatsapp" ? ".pdf,.txt,.doc,.docx,.xls,.xlsx,.ppt,.pptx" : undefined}
                                                hidden onChange={(event) => selectAttachment(event, "file")} />
                                            <Button htmlType="button" icon={<FileImageOutlined />} onClick={() => photoPicker.current?.click()}>Image</Button>
                                            <Button htmlType="button" icon={<PaperClipOutlined />} onClick={() => filePicker.current?.click()}>File</Button>
                                            <Button htmlType="button" icon={<LinkOutlined />} aria-expanded={Boolean(link)} disabled={sendAttachmentSeparately}
                                                onClick={() => setLinkDraft(link ? null : { conversationId, value: "" })}>Link</Button>
                                        </Space>
                                    )}
                                    <Button htmlType="submit" type="primary" icon={<SendOutlined />}
                                        disabled={!canReply || (!replyBody && !hasAttachments) || Array.from(replyBody).length > replyLimit}>Send reply</Button>
                                </div>
                            </>
                        )}
                    </form>
                    {canReply && quickReplyChat === conversationId && (
                        <QuickReplyPicker canRead={canReadQuickReplies} canCreate={canCreateQuickReply} canUpdate={canUpdateQuickReply} canInsert={!sendAttachmentSeparately}
                            initialBody={reply} onClose={() => setQuickReplyChat(null)} onInsert={(body) => {
                                const value = [reply.trimEnd(), body].filter(Boolean).join("\n");
                                if (Array.from(value).length > replyLimit) return `The reply exceeds the ${replyLimit}-character limit.`;
                                setReply(value);
                                setQuickReplyChat(null);
                            }} />
                    )}
                </section>

                <section className="ci-inbox-pane ci-inbox-details" aria-labelledby="ci-details">
                    <header className="ci-inbox-pane-header">
                        <Title level={5} id="ci-details"><Space size={8}><InfoCircleOutlined aria-hidden="true" />Conversation details</Space></Title>
                    </header>
                    <div className="ci-inbox-details-body">
                        {conversation ? (
                            <div className="ci-details-contact">
                                <CustomerAvatar conversation={conversation} size={44} />
                                <Text strong>{customerLabel(conversation)}</Text>
                            </div>
                        ) : <Text type="secondary">Select a conversation to view details.</Text>}
                        <dl>
                            {Object.entries({
                                Channel: conversation?.channel_account?.name,
                            }).map(([label, value]) => (
                                <div key={label}>
                                    <dt>{label}</dt>
                                    <dd>{value ?? "—"}</dd>
                                </div>
                            ))}
                        </dl>
                        {conversation && groups && (
                            <div className="ci-conversation-group">
                                <Text strong>Group</Text>
                                {canUpdateGroups ? (
                                    <Select aria-label="Conversation group" value={conversation.conversation_group_id ?? 0} options={groupOptions}
                                        onChange={updateConversationGroup} disabled={assigningGroup || assigningChats} loading={assigningGroup} />
                                ) : (
                                    <Text>{groupOptions.find(({ value }) => value === (conversation.conversation_group_id ?? 0))?.label ?? "—"}</Text>
                                )}
                            </div>
                        )}
                        {conversationId && <ConversationMetadata key={conversationId} conversationId={conversationId} />}
                        {canViewNotes && <ConversationNotes key={conversationId} conversationId={conversationId} revision={revision + notesRevision} />}
                    </div>
                </section>
            </div>
        </div>
    );
}
