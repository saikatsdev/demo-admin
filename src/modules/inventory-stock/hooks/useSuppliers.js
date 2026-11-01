import { useCallback, useEffect, useRef, useState } from "react";
import { getSuppliers, getTrashedSuppliers } from "../api";

export default function useSuppliers(enabled) {
    const [filters, setFilters] = useState({ page: 1, paginate_size: 20, search_key: "", status: undefined, trashed: false });

    const [state, setState] = useState({ rows: [], total: 0, loading: false, error: null });
    const requestId         = useRef(0);
    const filtersRef        = useRef(filters);

    const reload = useCallback(async () => {
        if (!enabled) return;

        const currentFilters = filtersRef.current;

        const id = ++requestId.current;

        setState((previous) => ({ ...previous, loading: true, error: null }));

        try {
            const { trashed, ...params } = currentFilters;

            const response = await (trashed ? getTrashedSuppliers : getSuppliers)(params);

            if (id !== requestId.current) return;

            if (!response?.success) {
                setState({ rows: [], total: 0, loading: false, error: response?.message || "Unable to load suppliers. Please try again." });
                return;
            }

            const result = response.result || {};

            const total = Number(result.meta?.total) || 0;

            const lastPage = Math.max(1, Math.ceil(total / currentFilters.paginate_size));

            if (currentFilters.page > lastPage) {
                setFilters((previous) => ({ ...previous, page: lastPage }));
                return;
            }
            
            setState({ rows: result.data || [], total, loading: false, error: null });
        } catch {
            if (id === requestId.current) setState({ rows: [], total: 0, loading: false, error: "Unable to load suppliers. Please try again." });
        }
    }, [enabled]);

    useEffect(() => {
        filtersRef.current = filters;
        reload();
        return () => { requestId.current += 1; };
    }, [filters, reload]);

    const changeFilters = useCallback((patch) => {
        requestId.current += 1;
        setFilters((previous) => ({ ...previous, page: 1, ...patch }));
    }, []);

    return { ...state, filters, changeFilters, reload };
}
