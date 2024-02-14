import { getLatest } from './currencyapi.js'

// Currency section

export async function getCurrency({ from, value, to, logger }) {
    const cached = getCache(from, to)
    if (cached) {
        return {
            value: cached.value * value,
            delta: cached.delta
        }
    }

    const latest = await getLatest({ from, to, logger })
    if (!latest) {
        return null
    }

    setCache(from, to, latest)

    return {
        value: latest.value * value,
        delta: latest.delta
    }
}

// Cache section

const cache = {}

function getCacheKey(from, to) {
    const key = { from, to }
    return JSON.stringify(key)
}

function setCache(from, to, latest) {
    cache[getCacheKey(from, to)] = {
        value: latest.value,
        delta: latest.delta,
        timeout: performance.now() + 1000 * 3600 * 6 // 6 hours
    }
}

function getCache(from, to) {
    const cached = cache[getCacheKey(from, to)]
    if (!cached || cached.timeout < performance.now()) {
        return null;
    }

    return {
        value: cached.value,
        delta: cached.delta
    }
}
