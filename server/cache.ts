
import { LRUCache } from 'lru-cache'

async function fetchAndCache(cache: LRUCache<string, any, unknown>, key: string, fetchFunc: (key: string) => any | undefined): Promise<any | undefined> {
    let cachedValue = cache.get(key);

    if (!cachedValue) {

        const promise = fetchFunc(key);
        cache.set(key, promise);

        try {
            cachedValue = await promise;

            cache.set(key, cachedValue); // Optionally set individual TTL
            return cachedValue;
        } catch (error) {
            // If the fetch fails, remove the promise from the cache
            cache.delete(key);
            throw error;
        }
    } else if (cachedValue instanceof Promise) {
        // If a promise is already pending, wait for it to resolve
        return cachedValue;
    } else {
        // If a resolved value is cached, return it immediately
        return cachedValue;
    }
}

export { fetchAndCache }