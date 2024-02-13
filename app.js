import { GatewayIntentBits, Partials } from 'discord.js'
import { createBot } from './dbot.js'
import { getLatest } from './currencyapi.js'

const cache = {}

function getCacheKey(from, to) {
    const key = { from, to }
    return JSON.stringify(key)
}

async function getCurrency(from, value, to) {
    const cValue = cache[getCacheKey(from, to)]

    if (cValue && cValue.timeout >= performance.now()) {
        return {
            value: cValue.value * value,
            delta: cValue.delta
        }
    }

    const result = await getLatest({ from, to })
    if (!result) {
        return null
    }

    cache[getCacheKey(from, to)] = {
        value: result.value,
        delta: result.delta,
        timeout: performance.now() + 1000 * 3600 * 6
    }

    return {
        value: result.value * value,
        delta: result.delta
    }
}

const convertRegex = /^(?<num>\d+(\.\d+)?) (?<code>[A-Z]+)(( (in|to|as))? (?<to>[A-Z]+))?$/;
const schemeRegex = /^\$(?<code>[A-Z]+)$/;

async function onMessage(message) {
    if (message.author.bot) {
        return;
    }

    if (await onConvert(message)) {
        return;
    }

    if (await onScheme(message)) {
        return;
    }
}

async function onConvert(message) {
    const groups = message.content.match(convertRegex)?.groups
    if (!groups) {
        return false;
    }

    const val = parseFloat(groups.num)
    if (isNaN(val)) {
        console.warn("Failed to fetch float from currency num")
        console.warn(groups.num)
        return true;
    }

    const curr = groups.code
    const to = groups.to || 'EUR'

    try {
        const obj = await getCurrency(curr, val, to)
        if (!obj) {
            console.warn("Failed to fetch currency")
            console.warn(val, curr, to)
            return true;
        }

        const { value, delta } = obj

        console.log(`Currency convert for ${val} ${curr}: ${value} ${to}`)
        let result = value.toFixed(2)
        if (Math.abs(value) < 1.0) {
            result = value
        }

        await message.reply({
            content: `${result} ${to} (${delta})`,
            allowedMentions: { repliedUser: false }
        })
    } catch (ex) {
        console.error("Failed to fetch currency")
        console.error(ex)
    }

    return true
}

async function onScheme(message) {
    const groups = message.content.match(schemeRegex)?.groups
    if (!groups) {
        return false;
    }

    const code = groups.code

    try {
        const obj = await getCurrency(code, 1, 'EUR')
        if (!obj) {
            console.warn("Failed to fetch scheme currency")
            console.warn(1, code, 'EUR')
            return true;
        }

        let currToEur = obj.value

        let eurToCurr = 1.0 / currToEur
        console.log(`Currency convert for ${eurToCurr} ${code} <=> ${currToEur} EUR`)

        eurToCurr *= 100
        currToEur *= 100
        if (Math.abs(eurToCurr) >= 1.0) {
            eurToCurr = eurToCurr.toFixed(2)
        }

        if (Math.abs(currToEur) >= 1.0) {
            currToEur = currToEur.toFixed(2)
        }

        const top = `100 ${code} = ${currToEur} EUR`
        const bottom = `100 EUR = ${eurToCurr} ${code}`

        await message.reply({
            content: `${top}\n${bottom}`,
            allowedMentions: { repliedUser: false }
        })
    } catch (ex) {
        console.error("Failed to fetch scheme currency")
        console.error(ex)
    }

    return true
}

const cbot = createBot({
    authPrefix: 'C',
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
    partials: [Partials.Message, Partials.Channel],
    ready: client => {
        console.log(`Logged in as ${client.user.tag}`)
    },
    eventsCallback: client => {
        client.on('messageCreate', onMessage)
    }
})
