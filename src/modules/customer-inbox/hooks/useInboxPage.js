import { useEffect, useState } from "react";

export default function useInboxPage(load, enabled, id, page, revision) {
    const [result, setResult] = useState(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!enabled) return;
        let active = true;
        load(id, page).then((response) => {
            if (!active) return;
            if (response?.success && Array.isArray(response.result?.data)) {
                setResult({ id, page, data: response.result });
                setError(false);
            } else {
                setError(true);
            }
        }).catch(() => {
            if (active) setError(true);
        });
        return () => { active = false; };
    }, [load, enabled, id, page, revision]);

    return { data: result?.id === id && result?.page === page ? result.data : null, error };
}
