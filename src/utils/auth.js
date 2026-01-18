// src/utils/auth.js

// 1) Basic non-empty string check
export function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

// 2) Normalize possible "Bearer <token>" formats to just the raw token
export function normalizeToken(token) {
  if (!isNonEmptyString(token)) return null;
  const trimmed = token.trim();
  return trimmed.toLowerCase().startsWith('bearer ')
    ? trimmed.slice(7).trim()
    : trimmed;
}

// 3) Base64URL decode that works in browser (atob) and Node (Buffer)
function base64UrlDecode(str) {
  try {
    const padded = str.replace(/-/g, '+').replace(/_/g, '/')
      .padEnd(Math.ceil(str.length / 4) * 4, '=');

    if (typeof atob === 'function') {
      // Browser
      return decodeURIComponent(
        Array.prototype.map.call(atob(padded), (c) =>
          '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join('')
      );
    }
    // Node fallback
    // eslint-disable-next-line no-undef
    if (typeof Buffer !== 'undefined') {
      // eslint-disable-next-line no-undef
      return Buffer.from(padded, 'base64').toString('utf8');
    }
  } catch {
    // noop
  }
  return null;
}

// 4) Decode JWT payload safely (no signature verification, just parsing)
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

// 5) Check if a JWT is expired (with small clock skew)
export function isJwtExpired(token, skewSeconds = 60) {
  const payload = parseJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return true; // no exp -> treat as expired
  const now = Math.floor(Date.now() / 1000);
  return payload.exp <= now + skewSeconds;
}

// 6) Main helper you asked for
// - rejects null/empty/"Bearer " only
// - if token looks like a JWT, ensures it's not expired
export function isTokenUsable(rawToken, skewSeconds = 60) {
  const t = normalizeToken(rawToken);
  if (!isNonEmptyString(t)) return false;
  const looksLikeJwt = t.split('.').length === 3;
  return looksLikeJwt ? !isJwtExpired(t, skewSeconds) : true;
}
