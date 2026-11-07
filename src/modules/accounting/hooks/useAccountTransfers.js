import { useCallback, useEffect, useRef, useState } from "react";
import { getAccountTransfers, getAccountTransferSummary, getTrashedAccountTransfers } from "../api/accountTransferApi";

const emptySummary = { total_transferred: 0, posted_count: 0, draft_count: 0, cancelled_count: 0 };

export default function useAccountTransfers(enabled) {
    const [rows, setRows]       = useState([]);
    const [total, setTotal]     = useState(0);
    const [summary, setSummary] = useState(emptySummary);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState(null);
    const [filters, setFilters] = useState({ page: 1, paginate_size: 10, search_key: "", account_id: undefined, status: undefined, date_from: undefined, date_to: undefined, trashed: false });
    const filtersRef            = useRef(filters);
    const requestId             = useRef(0);

    useEffect(() => { filtersRef.current = filters; }, [filters]);

    const load = useCallback(async (nextFilters = filtersRef.current) => {
        if (!enabled) return;
        const currentRequest = ++requestId.current;
        const { trashed, ...params } = nextFilters;
        setLoading(true);
        setError(null);

        try {
            const [listResponse, summaryResponse] = await Promise.all([
                (trashed ? getTrashedAccountTransfers : getAccountTransfers)(params),
                trashed ? Promise.resolve(null) : getAccountTransferSummary(params),
            ]);

            if (currentRequest !== requestId.current) return;
            if (!listResponse?.success) throw new Error(listResponse?.message || listResponse?.msg || "Unable to load account transfers");

            setRows(listResponse.result?.data || listResponse.result || []);
            setTotal(listResponse.result?.meta?.total ?? listResponse.result?.length ?? 0);
            setSummary(summaryResponse?.success ? (summaryResponse.result || emptySummary) : emptySummary);
        } catch (loadError) {
            if (currentRequest !== requestId.current) return;
            setRows([]);
            setTotal(0);
            setSummary(emptySummary);
            setError(loadError.message || "Unable to load account transfers");
        } finally {
            if (currentRequest === requestId.current) setLoading(false);
        }
    }, [enabled]);

    useEffect(() => { load(filters); }, [filters, load]);

    const changeFilters = useCallback((changes) => {
        setFilters((current) => ({ ...current, ...changes, page: "page" in changes ? changes.page : 1 }));
    }, []);

    const reload = useCallback(async () => {
        const current = filtersRef.current;
        if (current.page > 1 && rows.length === 1) {
            setFilters((value) => ({ ...value, page: value.page - 1 }));
            return;
        }
        await load(current);
    }, [load, rows.length]);

    return { rows, total, summary, loading, error, filters, changeFilters, reload };
}
