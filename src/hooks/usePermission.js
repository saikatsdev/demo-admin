import { useMemo } from "react";
import { useAuth } from "./useAuth";

export function usePermission() {
    const { user } = useAuth();

    const permissions = useMemo(() => {
        if (!user?.roles) return [];

        return [...new Set(user.roles.flatMap(role => role.permissions?.map(p => p.name)))];
    }, [user]);

    const can = (permission) => permissions.includes(permission);

    const canAny = (permissionList = []) => permissionList.some(p => permissions.includes(p));

    return {permissions, can, canAny};
}
