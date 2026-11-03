import { useCallback, useEffect, useRef, useState } from "react";
import { getAccounts, getTrashedAccounts } from "../api/accountApi";

export default function useAccounts(enabled) {
    const [rows, setRows]       = useState([]);
    const [total, setTotal]     = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState(null);
    const [filters, setFilters] = useState({ page: 1, paginate_size: 10, search_key: "", type: undefined, status: undefined, trashed: false });
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
            const response = await (trashed ? getTrashedAccounts : getAccounts)(params);

            if (currentRequest !== requestId.current) return;

            if (!response?.success) {
                throw new Error(response?.message || response?.msg || "Unable to load accounts");
            }

            setRows(response.result?.data || response.result || []);

            setTotal(response.result?.meta?.total ?? response.result?.length ?? 0);

        } catch (loadError) {
            if (currentRequest !== requestId.current) return;

            setRows([]);
            setTotal(0);
            setError(loadError.message || "Unable to load accounts");
            
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

    return { rows, total, loading, error, filters, changeFilters, reload };
}
