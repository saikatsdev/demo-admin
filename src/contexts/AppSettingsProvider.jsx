import { useEffect, useState } from "react";
import { getDatas } from "../api/common/common";
import { AppSettingsContext } from "./AppSettingsContext";

export default function AppSettingsProvider({ children }) {
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await getDatas("/settings");

                if (res?.success) {
                    const formatted = res.result.reduce((acc, item) => {
                        acc[item.key] = item.value;
                        return acc;
                    }, {});
                    setSettings(formatted);
                }
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    return (
        <AppSettingsContext.Provider value={{ settings, loading, error }}>
            {children}
        </AppSettingsContext.Provider>
    );
}
