function proxy(func, prefix) {
    return (...args) => func(`${prefix}>`, ...args)
}

export default function createLogger(prefix) {
    return {
        log: proxy(console.log, prefix),
        warn: proxy(console.warn, prefix),
        error: proxy(console.error, prefix)
    }
}
