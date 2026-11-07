import { useCallback, useEffect, useRef, useState } from "react";
import { getExpenses, getExpenseSummary, getTrashedExpenses } from "../api/expenseApi";

const initialFilters = {
    page               : 1,
    paginate_size      : 20,
    search_key         : "",
    expense_category_id: undefined,
    account_id         : undefined,
    status             : undefined,
    date_from          : undefined,
    date_to            : undefined,
    trashed            : false,
};

export default function useExpenses(enabled) {
    const [rows, setRows]       = useState([]);
    const [total, setTotal]     = useState(0);
    const [summary, setSummary] = useState({ total_expense: 0, expense_count: 0, average_expense: 0, by_category: [] });
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
            const listPromise = (trashed ? getTrashedExpenses : getExpenses)(params);
            const summaryPromise = trashed ? Promise.resolve(null) : getExpenseSummary(summaryFilters);
            const [listResponse, summaryResponse] = await Promise.all([listPromise, summaryPromise]);

            if (currentRequest !== requestId.current) return;
            if (!listResponse?.success) throw new Error(listResponse?.message || listResponse?.msg || "Unable to load expenses");

            setRows(listResponse.result?.data || listResponse.result || []);
            setTotal(listResponse.result?.meta?.total ?? listResponse.result?.total ?? listResponse.result?.length ?? 0);

            if (!trashed && summaryResponse?.success) {
                setSummary(summaryResponse.result || { total_expense: 0, expense_count: 0, average_expense: 0, by_category: [] });
            }
        } catch (loadError) {
            if (currentRequest !== requestId.current) return;
            setRows([]);
            setTotal(0);
            setError(loadError.message || "Unable to load expenses");
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
