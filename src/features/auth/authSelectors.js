export const selectAuth = (state) => state.auth;

export const selectUser = (state) => state.auth?.user;

export const selectRoles = (state) => state.auth?.user?.roles?.map(role => role.name) || [];

export const selectPermissions = (state) => {
    const roles = state.auth?.user?.roles || [];

    return [
        ...new Set(roles.flatMap(role =>role.permissions?.map(p => p.name))),
    ];
};
