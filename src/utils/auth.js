export function isNonEmptyString(v) {
    return typeof v === 'string' && v.trim().length > 0;
}

export function normalizeToken(token) {
    if (!isNonEmptyString(token)) return null;
    const trimmed = token.trim();
    return trimmed.toLowerCase().startsWith('bearer ') ? trimmed.slice(7).trim() : trimmed;
}

function base64UrlDecode(str) {
    try {
        const padded = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(str.length / 4) * 4, '=');

        if (typeof atob === 'function') {
            return decodeURIComponent(
                Array.prototype.map.call(atob(padded), (c) =>
                '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
                ).join('')
            );
        }
        
        if (typeof Buffer !== 'undefined') {
            // eslint-disable-next-line no-undef
            return Buffer.from(padded, 'base64').toString('utf8');
        }
    } catch {
        // noop
    }
    return null;
}

export function parseJwtPayload(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const json = base64UrlDecode(parts[1]);
        if (!json) return null;
        return JSON.parse(json);
    } catch {
        return null;
    }
}

export function isJwtExpired(token, skewSeconds = 60) {
    const payload = parseJwtPayload(token);
    if (!payload || typeof payload.exp !== 'number') return true;
    const now = Math.floor(Date.now() / 1000);
    return payload.exp <= now + skewSeconds;
}

export function isTokenUsable(rawToken, skewSeconds = 60) {
    const t = normalizeToken(rawToken);
    if (!isNonEmptyString(t)) return false;
    const looksLikeJwt = t.split('.').length === 3;
    return looksLikeJwt ? !isJwtExpired(t, skewSeconds) : true;
}