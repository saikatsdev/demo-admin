import { useCallback, useEffect, useRef } from "react";
import { setConversationTyping } from "../api/inboxApi";

export default function useConversationTyping(conversationId, platform) {
    const current  = useRef(null);
    const timer    = useRef(null);
    const requests = useRef(Promise.resolve());

    const send = useCallback((id, typing) => {
        requests.current = requests.current.then(() => setConversationTyping(id, typing)).catch(() => {});
    }, []);

    const stop = useCallback(() => {
        window.clearTimeout(timer.current);
        if (!current.current) return;
        if (current.current.platform !== "messenger") return;
        send(current.current.id, false);
        current.current = null;
    }, [send]);

    useEffect(() => stop, [conversationId, platform, stop]);

    const update = (value) => {
        if (!conversationId || !value.trim()) {
            stop();
            return;
        }

        const now = Date.now();
        const sameConversation = current.current?.id === conversationId && current.current?.platform === platform;
        if (!sameConversation) stop();
        const refreshInterval = platform === "telegram" ? 4000 : 10000;
        if (!sameConversation || now - current.current.sentAt >= refreshInterval) {
            current.current = { id: conversationId, platform, sentAt: now };
            send(conversationId, true);
        }

        if (platform !== "messenger") return;
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(stop, 2500);
    };

    return { update, stop };
}
