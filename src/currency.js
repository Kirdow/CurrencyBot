import { getLatest, getHistory } from './currencyapi.js'
import { getCurrencies } from './currencies.js'
import { getFormatDate, fromUnicodes } from './util.js'

// Display section

export function formCurrency(obj) {
    if (Array.isArray(obj)) {
        return formCurrency({ items: obj })
    }

    let { isPost, prefix, items } = obj
    const icon = fromUnicodes(...items)
    prefix ||= ''
    const fullIcon = `${prefix}${icon}`
    return {
        isPost,
        prefix,
        icon: fullIcon,
        format: (value) => {
            if (isPost) {
                return `${value}${fullIcon}`
            } else {
                return `${fullIcon}${value}`
            }
        }
    }
}

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

export async function getCurrencyHistory({ from, to, times, logger }) {
    const result = []

    for (const time of times) {
        const date = new Date()
        date.setDate(date.getDate()-time)
        const history = await getHistory({ from, to, date, logger })
        logger.log("history rec", history)
        if (!history) {
            result.push({
                value: 0.0
            })
        } else {
            result.push({
                value: parseFloat(history.value)
            })
        }
    }

    return result
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
