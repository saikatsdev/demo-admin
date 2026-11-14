import { useEffect, useRef, useState } from "react";
import { getMessages } from "../api/inboxApi";

export default function useInboxHistory(conversationId, revision) {
    const [result, setResult]             = useState(null);
    const [errorId, setErrorId]           = useState(null);
    const [olderRequest, setOlderRequest] = useState(null);
    const pending                         = useRef(null);
    const history                         = result?.id === conversationId ? result : null;

    useEffect(() => {
        return () => {
            pending.current?.abort();
            pending.current = null;
        };
    }, [conversationId]);

    useEffect(() => {
        if (!conversationId) return;
        const request = new AbortController();
        getMessages(conversationId, undefined, request.signal).then((page) => {
            if (request.signal.aborted) return;
            setErrorId(null);
            setResult((current) => {
                const oldest = page.data.at(-1)?.id;
                if (current?.id !== conversationId || !oldest || current.data[0]?.id < oldest) {
                    return { id: conversationId, data: page.data, hasOlder: Boolean(page.next_page_url) };
                }

                const retained = current.data.filter(({ id }) => id < oldest);
                return {
                    id: conversationId,
                    data: [...page.data, ...retained],
                    hasOlder: retained.length ? current.hasOlder : Boolean(page.next_page_url),
                };
            });
        }).catch(() => {
            if (!request.signal.aborted) setErrorId(conversationId);
        });
        return () => request.abort();
    }, [conversationId, revision]);

    const loadOlder = (beforePrepend) => {
        const beforeId = history?.data.at(-1)?.id;
        if (!history?.hasOlder || !beforeId || pending.current) return;

        const request = new AbortController();
        pending.current = request;
        setOlderRequest({ id: conversationId, loading: true, signal: request.signal });
        getMessages(conversationId, beforeId, request.signal).then((page) => {
            if (request.signal.aborted) return;
            if (page.data.length) beforePrepend();
            setResult((current) => {
                if (current?.id !== conversationId || current.data.at(-1)?.id !== beforeId) return current;
                return {
                    ...current,
                    data: [...current.data, ...page.data],
                    hasOlder: Boolean(page.next_page_url),
                };
            });
            setOlderRequest(null);
        }).catch(() => {
            if (!request.signal.aborted) setOlderRequest({ id: conversationId, error: true });
        }).finally(() => {
            if (pending.current === request) pending.current = null;
        });
    };

    const older = olderRequest && olderRequest.id === conversationId && !olderRequest.signal?.aborted ? olderRequest : null;
    return { history, error: errorId === conversationId, older, loadOlder };
}
