export function sleep(ms) {
    return new Promise(r => setTimeout(r, ms))
}

export function getFormatDate(date) {
    const year = date.getYear() + 1900
    const month = date.getMonth() + 1
    const day = date.getDate()

    const yearStr = year.toString()
    const monthStr = month.toString().padStart(2, '0')
    const dayStr = day.toString().padStart(2, '0')

    return `${yearStr}-${monthStr}-${dayStr}`
}

export function getDeltaStr(v1, v2, time) {
    time ||= '24h'
    if (isNaN(v1) || isNaN(v2)) {
        return ''
    }

    const delta = (v2 - v1) / v1 * 100
    let deltaStr = `${delta.toFixed(2)}%`
    if (delta > 0) {
        deltaStr = `+${deltaStr}`
    }

    return `${deltaStr} ${time} change`
}
