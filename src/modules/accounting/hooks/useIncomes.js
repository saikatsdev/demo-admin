import { useCallback, useEffect, useRef, useState } from "react";
import { getIncomeSummary, getIncomes, getTrashedIncomes } from "../api/incomeApi";

const initialFilters = {
    page              : 1,
    paginate_size     : 20,
    search_key        : "",
    income_category_id: undefined,
    account_id        : undefined,
    status            : undefined,
    date_from         : undefined,
    date_to           : undefined,
    trashed           : false,
};

const emptySummary = { total_income: 0, income_count: 0, average_income: 0, by_category: [] };

export default function useIncomes(enabled) {
    const [rows, setRows]       = useState([]);
    const [total, setTotal]     = useState(0);
    const [summary, setSummary] = useState(emptySummary);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState(null);
    const [filters, setFilters] = useState(initialFilters);
    const filtersRef            = useRef(filters);
    const requestId             = useRef(0);

    useEffect(() => { filtersRef.current = filters; }, [filters]);

    const load = useCallback(async (nextFilters = filtersRef.current) => {
        if (!enabled) return;
        const currentRequest = ++requestId.current;
        const { trashed, page, paginate_size, ...summaryFilters } = nextFilters;
        const params = { ...summaryFilters, page, paginate_size };

        setLoading(true);
        setError(null);

        try {
            const [listResponse, summaryResponse] = await Promise.all([
                (trashed ? getTrashedIncomes : getIncomes)(params),
                trashed ? Promise.resolve(null) : getIncomeSummary(summaryFilters),
            ]);

            if (currentRequest !== requestId.current) return;
            if (!listResponse?.success) {
                throw new Error(listResponse?.message || listResponse?.msg || "Unable to load income");
            }

            setRows(listResponse.result?.data || listResponse.result || []);
            setTotal(listResponse.result?.meta?.total ?? listResponse.result?.total ?? listResponse.result?.length ?? 0);
            setSummary(!trashed && summaryResponse?.success ? (summaryResponse.result || emptySummary) : emptySummary);
        } catch (loadError) {
            if (currentRequest !== requestId.current) return;
            setRows([]);
            setTotal(0);
            setSummary(emptySummary);
            setError(loadError.message || "Unable to load income");
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
