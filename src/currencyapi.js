import { getFormatDate, getDeltaStr } from './util.js'


async function requestData({ from, to, time }) {
    const response = await fetch(`https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/${time}/currencies/${from}/${to}.json`)
    return await response.json()
}

export async function getHistory({ from, to, date, logger }) {
    from = from.toLowerCase()
    to = to.toLowerCase()
    const dateStr = getFormatDate(date)

    try {
        logger.log(`Requesting history (${dateStr}) value from Currency API: {from: ${from}, to: ${to}}`)
        const data = await requestData({ from, to, time: dateStr })
        const value = parseFloat(data[to])
        if (isNaN(value)) {
            logger.warn(`Received no value from Currency API, currency is probably invalid`)
            return null
        }

        logger.log("Result", typeof(data), data, data[to])

        return {
            value: data[to]
        }
    } catch (ex) {
        logger.error("Failed to fetch API")
        logger.error(ex)
        return null
    }
}

export async function getLatest({ from, to, logger }) {
    from = from.toLowerCase()
    to = to.toLowerCase()
    try {
        logger.log(`Requesting current value from Currency API: {from: ${from}, to: ${to}}`)
        const data = await requestData({ from, to, time: 'latest' })
        const value = parseFloat(data[to])
        if (isNaN(value)) {
            logger.warn(`Received no value from Currency API, currency is probably invalid`)
            return null
        }

        const date = new Date(data.date)
        date.setDate(date.getDate()-1)

        logger.log(`Requesting yesterday (${getFormatDate(date)}) value from Currency API`)
        const lastData = await requestData({ from, to, time: getFormatDate(date) })
        const lastValue = parseFloat(lastData[to])
        if (isNaN(lastValue)) {
            logger.warn(`Received no value from Currency API, currency is probably invalid`)
            return null
        }

        logger.log("Result-0", typeof(data), data, data[to])
        logger.log("Result-1", typeof(lastData), lastData, lastData[to])

        return {
            value: data[to],
            delta: getDeltaStr(lastValue, value)
        }
    } catch (ex) {
        logger.error("Failed to fetch API")
        logger.error(ex)
        return null
    }
}
