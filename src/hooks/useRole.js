import { useMemo } from "react";
import { useAuth } from "./useAuth";

export function useRole() {
    const { user } = useAuth();

    const roles = useMemo(() => user?.roles?.map(r => r.name) || [],[user]);

    const hasRole = (role) => roles.includes(role);

    const hasAnyRole = (roleList = []) => roleList.some(r => roles.includes(r));

    return {roles,hasRole,hasAnyRole};
}
