function getFormatDate(date) {
    const year = date.getYear() + 1900
    const month = date.getMonth() + 1
    const day = date.getDate()

    const yearStr = year.toString()
    const monthStr = month.toString().padStart(2, '0')
    const dayStr = day.toString().padStart(2, '0')

    return `${yearStr}-${monthStr}-${dayStr}`
}

function getDeltaStr(v1, v2) {
    if (isNaN(v1) || isNaN(v2)) {
        return ''
    }

    const delta = (v2 - v1) / v1 * 100
    let deltaStr = `${delta.toFixed(2)}%`
    if (delta > 0) {
        deltaStr = `+${deltaStr}`
    }

    return `${deltaStr} 24h change`
}

export async function getLatest({ from, to }) {
    from = from.toLowerCase()
    to = to.toLowerCase()
    try {
        const response = await fetch(`https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/${from}/${to}.json`)
        const data = await response.json()
        const value = parseFloat(data[to])
        if (isNaN(value)) {
            return null
        }

        const date = new Date(data.date)
        date.setDate(date.getDate()-1)
        const lastResponse = await fetch(`https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/${getFormatDate(date)}/currencies/${from}/${to}.json`)
        const lastData = await lastResponse.json()
        const lastValue = parseFloat(lastData[to])
        if (isNaN(lastValue)) {
            return null
        }
        console.log("Result-0", typeof(data), data, data[to])
        console.log("Result-1", typeof(lastData), lastData, lastData[to])

        return {
            value: data[to],
            delta: getDeltaStr(lastValue, value)
        }
    } catch (ex) {
        console.error("Failed to fetch API")
        console.error(ex)
        return null
    }
}
