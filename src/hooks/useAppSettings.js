import { useEffect, useState } from "react";
import { getDatas } from "../api/common/common";

const useAppSettings = (keys = []) => {
    const [settings, setSettings] = useState({});
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState(null);

    useEffect(() => {
        let mounted = true;

        const getSettingsData = async () => {
            try {
                setLoading(true);

                const res = await getDatas("/settings", { keys });

                if (res?.success && mounted) {
                    const formatted = res.result.reduce((acc, item) => {
                        acc[item.key] = item.value;
                        return acc;
                    }, {});

                    setSettings(formatted);
                }
            } catch (err) {
                if (mounted) setError(err);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        getSettingsData();

        return () => {
        mounted = false;
        };
    }, [JSON.stringify(keys)]);

    return { settings, loading, error };
};

export default useAppSettings;
