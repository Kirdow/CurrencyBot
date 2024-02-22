import { EmbedBuilder, GatewayIntentBits, Partials } from 'discord.js'
import { createBot } from './dbot.js'
import { getCurrency, getCurrencyHistory, getHistoryValues } from './currency.js'
import { getCurrencyIcon } from './currencies.js'
import { generateAndCacheGraph, generateCurrencyEntry } from './graph.js'
import {sleep} from './util.js'
import createLogger from './logger.js'

import SourceCommand from './cmd/source.js'
import ConvertCommand from './cmd/convert.js'
import SchemeCommand from './cmd/scheme.js'
import PingCommand from './cmd/ping.js'

const convertRegex = /^(?<num>\-?\d+(\.\d+)?) (?<code>[A-Z]+)(( (in|to|as))? (?<to>[A-Z]+))?$/;
const schemeRegex = /^\$(?<code>[A-Z]+)$/;
const schemeRegexInteraction = /^\$?(?<code>[A-Z]+)$/;

async function onConvert({ content, data, reply, interaction, logger }) {
    const val = parseFloat(data.value)
    if (isNaN(val)) {
        logger.warn("Failed to fetch float from currency num")
        logger.warn(data.value)
        return true;
    }

    const curr = data.from
    const to = data.to || 'EUR'

    try {
        const obj = await getCurrency({ from: curr, value: val, to, logger })
        if (!obj) {
            logger.warn("Failed to fetch currency")
            logger.warn(val, curr, to)
            return true;
        }

        const { value, delta } = obj

        logger.log(`Currency convert for ${val} ${curr}: ${value} ${to}`)

        const embeds = [
            new EmbedBuilder()
                .setColor(0xA0FF00)
                .setTitle(`Conversion for ${curr} to ${to}`)
                .addFields(
                    { name: `${curr}`, value: getCurrencyIcon(curr).format(val), inline: true },
                    { name: `${to}`, value: getCurrencyIcon(to).format(value), inline: true }
                )
                .setTimestamp(getCurrencyDate())
                .setFooter({ text: cbot.user.username, iconURL: getBotAvatarUrl() })
        ]

        await reply({
            content: '',
            embeds
        })
    } catch (ex) {
        logger.error("Failed to fetch currency")
        logger.error(ex)
    }

    return true
}

async function onScheme({ username, data, reply, logger }) {
    let code = data.currency
    const currencies = code.split(", ")
    if (currencies.length > 1) {
        code = currencies[0]
        logger.log("Currencies", currencies)
    }

    const ref = data.reference || 'EUR'

    try {
        const startTime = performance.now() / 1000
        const obj = await getCurrency({ from: code, value: 1, to: ref, logger })
        if (!obj) {
            logger.warn("Failed to fetch scheme currency")
            logger.warn(1, code, ref)
            return true;
        }

        let currToRef = obj.value

        let refToCurr = 1.0 / currToRef
        logger.log(`Currency convert for ${refToCurr} ${code} <=> ${currToRef} ${ref}`)

        refToCurr *= 100
        currToRef *= 100

        const top = `100 ${code} = ${getCurrencyIcon(ref).format(currToRef)}`
        const bottom = `100 ${ref} = ${getCurrencyIcon(code).format(refToCurr)}`

        const historyStr = [
            null, '24h', '1w', '1m', '3m'
        ]

        let history = null

        const getChange = (id, model) => {
            model ??= history
            const v1 = model[id].value || 0.0
            const v2 = model[0].value || 0.0

            const delta = (v2 - v1) / v1 * 100
            let deltaStr = `${delta.toFixed(2)}%`
            if (delta > 0) {
                deltaStr = `+${deltaStr}`
            }

            logger.log(`History ID ${id} (${historyStr[id]}) = ${v1} -> ${v2} => ${deltaStr}`)
            return deltaStr
        };

        const histories = []
        const entries = []
        for (let currencyIndex = 0; currencyIndex < currencies.length; currencyIndex++) {
            const currencyHistory = await getCurrencyHistory({
                from: currencies[currencyIndex],
                to: ref,
                times: [
                    0, 1, 7, 30, 90,
                    [80, 70, 60, 50, 40],
                    [26, 22, 18, 14, 10],
                    [6,  5,  4,  3,  2 ]
                ],
                logger
            })

            if (!currencyHistory) continue

            histories.push(currencyHistory)
            if (!history) history = currencyHistory

            const values = getHistoryValues(currencyHistory)
            const entry = generateCurrencyEntry({ code: currencies[currencyIndex], icon: getCurrencyIcon(ref), values, index: entries.length })
            if (!entry) break

            entries.push(entry)
        }

        if (entries.length === 0) {
            await reply({
                content: 'Failed to fetch currencies',
                embeds: []
            })

            return
        }

        const values = getHistoryValues(history)
        logger.log("Generating graph for onScheme")
        const path = await generateAndCacheGraph({
            entries,
            bot: cbot,
            name: `graph_${username.replace('.','')}`,
            logger
        })

        const codes = []
        const topFields = []
        const historyFields = []
        if (currencies.length === 1) {
            codes.push(code)
            topFields.push(
                { name: `100 ${ref}`, value: getCurrencyIcon(code).format(refToCurr), inline: true },
                { name: `100 ${code}`, value: getCurrencyIcon(ref).format(currToRef), inline: true }
            )

            historyFields.push(
                { name: '24h', value: getChange(1), inline: true },
                { name: '1w', value: getChange(2), inline: true },
                { name: '1m', value: getChange(3), inline: true },
                { name: '3m', value: getChange(4), inline: true }
            )
        } else {
            for (let i = 0; i < entries.length; i++) {
                const entry = entries[i]
                const entryObj = await getCurrency({ from: entry.code, value: 1, to: ref, logger })
                if (!obj) {
                    logger.warn("Failed to fetch scheme currency")
                    logger.warn(1, entry.code, ref)
                    return true;
                }

                const codeToRef = entryObj.value * 100

                codes.push(entry.code)
                topFields.push({ name: `100 ${entry.code}`, value: getCurrencyIcon(ref).format(codeToRef), inline: true })

                historyFields.push(
                    { name: `24h ${entry.code}`, value: getChange(1, histories[i]), inline: true }
                )
            }

        }

        const endTime = performance.now() / 1000
        const elapsedTime = (endTime - startTime).toFixed(2)
        logger.log("Creating embed")
        const embeds = [
            new EmbedBuilder()
                .setColor(0xA0FF00)
                .setTitle(`${codes.join(", ")} <=> ${ref}`)
                .setDescription(`*Generated in ${elapsedTime}s*`)
                .setImage(path)
                .addFields(
                    ...topFields,
                    { name: `** **`, value: `**HISTORY**` },
                    ...historyFields
                )
                .setTimestamp(getCurrencyDate())
                .setFooter({ text: cbot.user.username, iconURL: getBotAvatarUrl() })
        ]

        logger.log("Sending embed")
        await reply({
            content: '',
            embeds
        })
    } catch (ex) {
        logger.error("Failed to fetch scheme currency")
        logger.error(ex)
        return false
    }

    return true
}

function getBotAvatarUrl() {
    return `https://cdn.discordapp.com/avatars/${cbot.user.id}/${cbot.user.avatar}.png`
}

function getCurrencyDate() {
    const date = new Date()
    if (date.getUTCHours() < 5.0) {
        date.setUTCDate(date.getUTCDate()-1)
    }

    date.setUTCHours(5, 0, 0, 0)
    return date
}

async function interactionResponse(interaction) {
    if (!interaction.isChatInputCommand()) return

    try {
        if (interaction.commandName === 'source') {
            const messageContent = {
                content: '',
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xAFFF00)
                        .setTitle("Currency Bot Source")
                        .setURL("https://github.com/Kirdow/CurrencyBot")
                        .addFields(
                            { name: 'Author', value: 'Kirdow', inline: true },
                            { name: 'Repository', value: '[GitHub](https://github.com/Kirdow/CurrencyBot)', inline: true }
                        )
                        .setTimestamp(new Date())
                        .setFooter({ text: cbot.user.username, iconURL: getBotAvatarUrl() })
                ]
            }


            const user = interaction.user
            let username = `${user.username}`
            if (user.discriminator !== '0') {
                username += `#${user.discriminator}`
            }

            console.log(`/source by ${username}`)
            await interaction.reply(messageContent)
        } else if (interaction.commandName === 'ping') {
            const user = interaction.user
            let username = `${user.username}`
            if (user.discriminator !== '0') {
                username += `#${user.discriminator}`
            }

            const samples = interaction.options.getNumber('samples')
            const skipSamples = samples - 2

            const startTime = performance.now()
            const msg = await interaction.reply({
                content: 'Pong!'
            })
            const endTime = performance.now()
            const initialTime = endTime - startTime

            await sleep(1500)

            const data = []
            for (let i = 0; i < samples; i++) {
                await sleep(500)
                const iterationStartTime = performance.now()
                await msg.edit({
                    content: `Pong${'.'.repeat(i + 1)}!`
                })
                const iterationEndTime = performance.now()
                const iterationTime = iterationEndTime - iterationStartTime
                data.push(iterationTime)
            }

            await sleep(500)

            data.sort()
            let total = 0.0
            for (let i = 1; i <= skipSamples; i++) {
                total += data[i]
            }

            await msg.edit({
                content: '',
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xAFFF00)
                        .setTitle("Latency Report")
                        .addFields(
                            { name: 'Initial Time :arrow_forward:', value: `**${Math.ceil(initialTime)}**ms` },
                            { name: 'High :up_arrow:', value: `**${Math.ceil(data[1 + skipSamples])}**ms`, inline: true },
                            { name: 'Low :down_arrow:', value: `**${Math.ceil(data[0])}**ms`, inline: true },
                            { name: `Average ${skipSamples} of ${samples} :arrows_counterclockwise:`, value: `**${Math.ceil(total / skipSamples)}**ms` }
                        )
                        .setTimestamp(new Date())
                        .setFooter({ text: cbot.user.username, iconURL: getBotAvatarUrl() })
                ]
            })
        } else if (interaction.commandName === 'convert') {
            const user = interaction.user
            let username = `${user.username}`
            if (user.discriminator !== '0') {
                username += `#${user.discriminator}`
            }

            const value = interaction.options.getNumber('value')
            const from = interaction.options.getString('from').toUpperCase()
            const to = (interaction.options.getString('to') || 'EUR').toUpperCase()

            const reply = async (data) => {
                return await interaction.editReply({
                    ...data
                })
            }

            await interaction.reply({
                content: `Processing...`
            })

            const logger = createLogger(username)
            logger.log(`/convert value:${value} from:${from} to:${to}`)
            if (!await onConvert({ username, data: { value, from, to }, reply, logger })) {
                logger.warn(`Something went wrong with the request.`)
                await interaction.editReply({
                    content: `Something went wrong with the request.`
                })
            }
        } else if (interaction.commandName === 'scheme') {
            const user = interaction.user
            let username = `${user.username}`
            if (user.discriminator !== '0') {
                username += `#${user.discriminator}`
            }
            
            const currency = interaction.options.getString('currency').toUpperCase()
            const reference = (interaction.options.getString('reference') || 'EUR').toUpperCase()

            const reply = async (data) => {
                return await interaction.editReply({
                    ...data
                })
            }

            await interaction.reply({
                content: `Processing...`
            })

            const logger = createLogger(username)
            logger.log(`/scheme currency:${currency} reference:${reference}`)
            if (!await onScheme({ username, data: { currency, reference }, reply, logger })) {
                logger.warn(`Something went wrong with the request.`)
                await interaction.editReply({
                    content: `Something went wrong with the request.`
                })
            }
        }
    } catch (ex) {
        console.error("Interaction failed")
        console.error(ex)
    }
}

const cbot = createBot({
    authPrefix: 'C',
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
    partials: [Partials.Message, Partials.Channel],
    ready: client => {
        console.log(`Logged in as ${client.user.tag}`)
    },
    commands: [
        SourceCommand,
        ConvertCommand,
        SchemeCommand,
        PingCommand
    ],
    eventsCallback: client => {
        client.on('interactionCreate', interactionResponse)
    }
})
