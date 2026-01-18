export const cachedFetch = async (key, apiFn, ttl = 10 * 60 * 1000) => {
    const cached = sessionStorage.getItem(key);

    if (cached) {
        const { data, expiry } = JSON.parse(cached);

        if (Date.now() < expiry) {
            return data;
        }
    }

    const data = await apiFn();

    sessionStorage.setItem(
        key,
        JSON.stringify({
            data,
            expiry: Date.now() + ttl
        })
    );

    return data;
};
