import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { getDatas } from "../api/common/common";
import { ModuleContext } from "./ModuleContext";

const normalizeModules = (modules = {}) => Object.fromEntries(
    Object.entries(modules).map(([name, enabled]) => [name.toUpperCase(), enabled === true]),
);

export default function ModuleProvider({ children }) {
    const token = useSelector((state) => state.auth?.token);
    const [modules, setModules] = useState({});
    const [resolvedToken, setResolvedToken] = useState(null);
    const [error, setError] = useState(null);
    const loading = Boolean(token) && resolvedToken !== token;

    useEffect(() => {
        let active = true;

        if (!token) {
            setModules({});
            setResolvedToken(null);
            setError(null);
            return () => {
                active = false;
            };
        }

        const fetchModules = async () => {
            setError(null);

            try {
                const response = await getDatas("/admin/modules/status");

                if (!active) return;

                if (response?.success) {
                    setModules(normalizeModules(response.result));
                } else {
                    setModules({});
                    setError(response?.message || "Unable to load modules");
                }
            } catch (requestError) {
                if (!active) return;

                setModules({});
                setError(requestError);
            } finally {
                if (active) setResolvedToken(token);
            }
        };

        fetchModules();

        return () => {
            active = false;
        };
    }, [token]);

    const isModuleEnabled = useCallback(
        (name) => modules[String(name).toUpperCase()] === true,
        [modules],
    );

    const value = useMemo(() => ({
        modules,
        loading,
        error,
        isModuleEnabled,
    }), [error, isModuleEnabled, loading, modules]);

    return (
        <ModuleContext.Provider value={value}>
            {children}
        </ModuleContext.Provider>
    );
}
