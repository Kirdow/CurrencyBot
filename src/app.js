import { EmbedBuilder, GatewayIntentBits, Partials } from 'discord.js'
import { createBot } from './dbot.js'
import { getCurrency, getCurrencyHistory } from './currency.js'
import {sleep} from './util.js'
import createLogger from './logger.js'

import SourceCommand from './cmd/source.js'
import CurrencyCommand from './cmd/currency.js'
import ConvertCommand from './cmd/convert.js'
import SchemeCommand from './cmd/scheme.js'
import PingCommand from './cmd/ping.js'

const convertRegex = /^(?<num>\-?\d+(\.\d+)?) (?<code>[A-Z]+)(( (in|to|as))? (?<to>[A-Z]+))?$/;
const schemeRegex = /^\$(?<code>[A-Z]+)$/;
const schemeRegexInteraction = /^\$?(?<code>[A-Z]+)$/;

async function onMessage(message) {
    if (message.author.bot) {
        return;
    }

    const reply = async (data) => {
        return await message.channel.send({
            ...data,
            allowedMentions: { repliedUser: false }
        })
    };

    const user = message.author
    let username = `${user.username}`
    if (user.discriminator !== '0') {
        username += `#${user.discriminator}`
    }

    const logger = createLogger(username)
    if (await handleCommand({ content: message.content, reply, logger })) {
        logger.log(`message prompt:${message.content} by ${username}`)
    }
}

async function handleCommand(opts) {
    if (await onConvert(opts)) {
        return true;
    }

    if (await onScheme(opts)) {
        return true;
    }

    return false;
}

async function onConvert({ content, reply, interaction, logger }) {
    const groups = content.match(convertRegex)?.groups
    if (!groups) {
        return false;
    }

    const val = parseFloat(groups.num)
    if (isNaN(val)) {
        logger.warn("Failed to fetch float from currency num")
        logger.warn(groups.num)
        return true;
    }

    const curr = groups.code
    const to = groups.to || 'EUR'

    try {
        const obj = await getCurrency({ from: curr, value: val, to, logger })
        if (!obj) {
            logger.warn("Failed to fetch currency")
            logger.warn(val, curr, to)
            return true;
        }

        const { value, delta } = obj

        logger.log(`Currency convert for ${val} ${curr}: ${value} ${to}`)
        const result = value.toFixed(Math.abs(value) >= 1.0 ? 2 : 8)

        if (interaction) {
            const embeds = [
                new EmbedBuilder()
                    .setColor(0xA0FF00)
                    .setTitle(`Conversion for ${curr} to ${to}`)
                    .addFields(
                        { name: `${curr}`, value: `${val}`, inline: true },
                        { name: `${to}`, value: `${result}`, inline: true }
                    )
                    .setTimestamp(getCurrencyDate())
                    .setFooter({ text: cbot.user.username, iconURL: getBotAvatarUrl() })
            ]

            await reply({
                content: '',
                embeds
            })
        } else {
            await reply({
                content: `${result} ${to} (${delta})`
            })
        }
    } catch (ex) {
        logger.error("Failed to fetch currency")
        logger.error(ex)
    }

    return true
}

async function onScheme({ content, ref, reply, interaction, logger }) {
    const groups = content.match(interaction ? schemeRegexInteraction : schemeRegex)?.groups
    if (!groups) {
        return false;
    }

    const code = groups.code
    ref ||= 'EUR'

    try {
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

        refToCurr = refToCurr.toFixed(Math.abs(refToCurr) >= 1.0 ? 2 : 8)
        currToRef = currToRef.toFixed(Math.abs(currToRef) >= 1.0 ? 2 : 8)

        const top = `100 ${code} = ${currToRef} ${ref}`
        const bottom = `100 ${ref} = ${refToCurr} ${code}`

        const history = await getCurrencyHistory({
            from: code, to: ref,
            times: [
                0, 1, 7, 30, 90
            ],
            logger
        })

        const historyStr = [
            null, '24h', '1w', '1m', '3m'
        ]

        const getChange = (id) => {
            const v1 = history[id].value || 0.0
            const v2 = history[0].value || 0.0

            const delta = (v2 - v1) / v1 * 100
            let deltaStr = `${delta.toFixed(2)}%`
            if (delta > 0) {
                deltaStr = `+${deltaStr}`
            }

            logger.log(`History ID ${id} (${historyStr[id]}) = ${v1} -> ${v2} => ${deltaStr}`)
            return deltaStr
        };

        if (interaction) {
            const embeds = [
                new EmbedBuilder()
                    .setColor(0xA0FF00)
                    .setTitle(`${code} <=> ${ref}`)
                    .addFields(
                        { name: `100 ${ref}`, value: `${refToCurr} ${code}`, inline: true },
                        { name: `100 ${code}`, value: `${currToRef} ${ref}`, inline: true },
                        { name: `** **`, value: `**HISTORY**` },
                        { name: '24h', value: getChange(1), inline: true },
                        { name: '1w', value: getChange(2), inline: true },
                        { name: '1m', value: getChange(3), inline: true },
                        { name: '3m', value: getChange(4), inline: true }
                    )
                    .setTimestamp(getCurrencyDate())
                    .setFooter({ text: cbot.user.username, iconURL: getBotAvatarUrl() })
            ]

            await reply({
                content: '',
                embeds
            })
        } else {
            await reply({
                content: `${top}\n${bottom}`
            })
        }
    } catch (ex) {
        logger.error("Failed to fetch scheme currency")
        logger.error(ex)
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
        } else if (interaction.commandName === 'currency') {
            const user = interaction.user
            let username = `${user.username}`
            if (user.discriminator !== '0') {
                username += `#${user.discriminator}`
            }

            let content = interaction.options.getString('prompt')
            if (!content) {
                console.log(`/currency by ${username} | No prompt specified`)
                await interaction.reply({
                    content: '# Usage\nAll of these require the `prompt` option for `/currency`\n### Conversion Prompt\n```\n<decimal> <from>\n```\nor\n```\n<decimal> <from> <to>\n```\n### Scheme Prompt\n```\n$<code>\n```',
                    ephemeral: true
                })
                return;
            }
            const reply = async (data) => {
                return await interaction.editReply({
                    ...data
                })
            }

            let silent = false
            if (content.startsWith('@silent ')) {
                await interaction.reply({
                    content: `Processing...`,
                    ephemeral: true
                })
                content = content.substr(8)
                silent = true
            } else {
                await interaction.reply({
                    content: `Processing...`
                })
            }

            const logger = createLogger(username)
            const silentLog = silent ? ' | silent' : ''
            logger.log(`/currency prompt:${content}${silentLog}`)
            if (!await handleCommand({ content, reply, interaction: true, logger })) {
                console.warn(`Something went wrong with the request.`)
                await interaction.editReply({
                    content: `Something went wrong with the request.`
                })
            }
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
            if (!await handleCommand({ content: `${value} ${from} ${to}`, reply, interaction: true, logger })) {
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
            if (!await handleCommand({ content: `$${currency}`, ref: reference, reply, interaction: true, logger })) {
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
        CurrencyCommand,
        ConvertCommand,
        SchemeCommand,
        PingCommand
    ],
    eventsCallback: client => {
        client.on('interactionCreate', interactionResponse)
        client.on('messageCreate', onMessage)
    }
})
