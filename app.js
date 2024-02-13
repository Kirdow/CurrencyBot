import { EmbedBuilder, GatewayIntentBits, Partials } from 'discord.js'
import { createBot } from './dbot.js'
import { getLatest } from './currencyapi.js'

import SourceCommand from './cmd/source.js'
import CurrencyCommand from './cmd/currency.js'

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

    const reply = async (data) => {
        return await message.channel.send({
            ...data,
            allowedMentions: { repliedUser: false }
        })
    };

    await handleCommand({ content: message.content, reply })
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

async function onConvert({ content, reply, embed }) {
    const groups = content.match(convertRegex)?.groups
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

        if (embed) {
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
        console.error("Failed to fetch currency")
        console.error(ex)
    }

    return true
}

async function onScheme({ content, reply, embed }) {
    const groups = content.match(schemeRegex)?.groups
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

        if (embed) {
            const embeds = [
                new EmbedBuilder()
                    .setColor(0xA0FF00)
                    .setTitle(`${code} <=> EUR`)
                    .addFields(
                        { name: `100 EUR`, value: `${eurToCurr} ${code}`, inline: true },
                        { name: `100 ${code}`, value: `${currToEur} EUR`, inline: true }
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
        console.error("Failed to fetch scheme currency")
        console.error(ex)
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
                            { name: 'Repository', value: '[Kirdow/CurrencyBot](https://github.com/Kirdow/CurrencyBot)', inline: true }
                        )
                        .setTimestamp(new Date())
                        .setFooter({ text: cbot.user.username, iconURL: getBotAvatarUrl() })
                ]
            }

            await interaction.reply(messageContent)
        } else if (interaction.commandName === 'currency') {
            const content = interaction.options.getString('prompt')
            if (!content) {
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

            await interaction.reply({
                content: `Processing...`
            })

            if (!await handleCommand({ content, reply, embed: true })) {
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
        CurrencyCommand
    ],
    eventsCallback: client => {
        client.on('interactionCreate', interactionResponse)
        client.on('messageCreate', onMessage)
    }
})
