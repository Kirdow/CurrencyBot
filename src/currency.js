import { getLatest, getHistory } from './currencyapi.js'
import { getCurrencies } from './currencies.js'
import { getFormatDate, fromUnicodes } from './util.js'

// Display section

export function formCurrency(code, obj) {
    if (Array.isArray(obj)) {
        return formCurrency(code, { items: obj })
    }

    let { isPost, prefix, items } = obj
    const icon = fromUnicodes(...items)
    prefix ||= ''
    const fullIcon = `${prefix}${icon}`
    return {
        code,
        isPost,
        prefix,
        icon: fullIcon,
        format: (value, fixed) => {
            let trimValue = value.toFixed(2)
            if (typeof fixed === 'number') {
                trimValue = value.toFixed(fixed)
            } else if (trimValue.toString() === '0.00') {
                trimValue = value.toFixed(Math.abs(value) >= 1.0 ? 2 : 8)
            }

            if (isPost) {
                return `${trimValue}${fullIcon}`
            } else {
                return `${fullIcon}${trimValue}`
            }
        }
    }
}

// Util section

export function getHistoryValues(history) {
    const values = []

    for (const value of history) {
        if (Array.isArray(value)) {
            values.push(getHistoryValues(value))
        } else {
            values.push(value.value)
        }
    }

    return values
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
        if (Array.isArray(time)) {
            const nestedArray = await getCurrencyHistory({
                from, to, times: time, logger
            })

            result.push(nestedArray)
            continue
        }

        const date = new Date()
        date.setDate(date.getDate()-time)
        const history = await getHistory({ from, to, date, logger })
        if (!history) {
            logger.warn(`Invalid currency; from:${from}, to:${to}`)
            return null
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
