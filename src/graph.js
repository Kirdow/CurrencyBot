import { createCanvas } from "canvas";
import fs from 'fs/promises';
import 'dotenv/config'
import path from 'path'

const graphPath = './files/graph/';

await fs.mkdir(graphPath, { recursive: true });

export async function generateAndCacheGraph({ entries, bot, name, logger }) {
    try {
        logger.log(`Generating graph image ${name}`)
        const path = await generateGraphImage({ entries, name, logger })
        if (!path) {
            logger.error(`Failed to generate graph`)
            return null
        }

        logger.log(`Uploading graph to cache`)
        const url = await cacheGraphFile({ bot, name: path, logger })
        if (!url) {
            logger.error(`Failed to upload graph to cache`)
            return null
        }

        return url
    } catch (ex) {
        logger.error("Failed to generate and upload graph. An error ocurred!")
        logger.error(ex)
        return null
    }
}

export async function cacheGraphFile({ bot, name, logger }) {
    logger.log(`Caching graph image, ${name}`)
    const channelId = process.env.GRAPH_CACHE_CHANNEL
    if (!channelId) {
        logger.error("Channel ID is undefined")
        return null
    }
    const channel = await bot.channels.fetch(channelId)
    if (!channel) {
        logger.error("Failed to fetch channel")
        return null
    }
    logger.log("Uploading graph image")
    const message = await channel.send({
        files: [{
            attachment: path.resolve(name),
            name: 'graph.png',
            description: 'Graph of currency change over 3 months'
        }]
    })

    if (message.attachments.size === 0) {
        logger.error("Failed to upload the graph")
        return null
    }

    logger.log("Upload complete, retrieving url")
    return message.attachments.first().url
}

function getAllValues(values) {
    const result = []
    for (const value of values) {
        if (typeof value === 'number') {
            result.push(value)
        } else if (Array.isArray(value)) {
            result.push(...getAllValues(value))
        }
    }
    return result
}

function getBounds(values) {
    const allValues = getAllValues(values)

    return [Math.min(...allValues), Math.max(...allValues)]
}

function getBoundsAll(entries) {
    let [min, max] = getBounds(entries[0].values)

    for (let i = 1; i < entries.length; i++) {
        const [minValue, maxValue] = getBounds(entries[i].values)
        if (minValue < min) min = minValue
        if (maxValue > max) max = maxValue
    }

    return [min, max]
}

function createColor(r, g, b) {
    return {
        r, g, b,
        opaque: () => `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`,
        alpha: (v) => `rgba(${r}, ${g}, ${b}, ${(v ?? 0.4)})`
    }
}

// Colors based on the first 6 colors of `tab 10` of a graph palette online
// Source: https://repec.sowi.unibe.ch/stata/palettes/colors/tab10q1.svg
const colors = [
    createColor(78, 121, 167),
    createColor(242, 142, 43),
    createColor(225, 87, 89),
    createColor(118, 183, 178),
    createColor(89, 161, 79),
    createColor(237, 201, 72)
]

const maxColors = colors.length

export function generateCurrencyEntry({ code, icon, values, index }) {
    const color = index < maxColors ? colors[index] : null
    if (!color) {
        return null
    }

    return {
        code,
        icon,
        values,
        index,
        color,
        stroke: () => color.opaque(),
        fill: () => color.alpha()
    }
}

function splitValues(entry) {
    const raw = entry.values.filter(p => typeof p === 'number')
    const block = entry.values.filter(Array.isArray)

    raw.shift()
    raw.reverse()

    return [raw, block]
}

export async function generateGraphImage({ entries, name, logger }) {
    // A lot of values in this function is hardcoded.
    // For initial implementation I only care about it working.
    // I will fix this in a later commit.

    logger.log("Generating graph canvas")

    const width = 500
    const height = 300
    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')

    ctx.fillStyle = 'rgba(0, 0, 0, 0)'
    ctx.fillRect(0, 0, width, height)

    const [minValue, maxValue] = getBoundsAll(entries)

    const topMargin = height * 0.1
    const bottomMargin = height * 0.25

    let minSize = 0.0
    for (const entry of entries) {
        const [min, max] = getBounds(entry.values)
        for (const text of [entry.icon.format(min * 100, 4), entry.icon.format(max * 100, 4)]) {
            ctx.font = 'bold 15px Arial'
            const size = ctx.measureText(text).width
            if (size > minSize) minSize = size
        }
    }

    const leftMargin = Math.ceil(Math.max(width * 0.15, minSize + 10))
    const rightMargin = width * 0.125
    const graphWidth = width - leftMargin - rightMargin

    const normalize = (value) => {
        return ((value - minValue) / (maxValue - minValue)) * (height - bottomMargin - topMargin) + bottomMargin
    }

    logger.log("Generating base frame")
    const timePoints = ['3m', '1m', '1w', '24h']
    const pointSpacing = graphWidth / 3
    ctx.fillStyle = 'rgba(255, 180, 180, 0.4)'
    ctx.fillRect(leftMargin, height - normalize(minValue), 3 * pointSpacing, 1)
    ctx.fillStyle = 'rgba(180, 255, 180, 0.4)'
    ctx.fillRect(leftMargin, height - normalize(maxValue), 3 * pointSpacing, 1)

    ctx.fillStyle = 'white'
    ctx.font = 'bold 12px Arial'
    timePoints.forEach((label, index) => {
        const x = leftMargin + index * pointSpacing
        ctx.fillRect(x, 11, 1, height - 30)
        ctx.fillText(label, x - 6, height - 8)

        if (index < 3) {
            const blockValues = splitValues(entries[0])[1]
            const block = blockValues[index]
            const delta = pointSpacing / (block.length + 1)
            for (let j = 1; j <= block.length; j++) {
                const blockX = x + j * delta
                ctx.fillRect(blockX, 11, 1, 4)
            }
        }
    })
    ctx.fillRect(leftMargin, height - 24, 3 * pointSpacing, 2)
    ctx.fillRect(leftMargin, 9, 3 * pointSpacing, 2)

    ctx.fillRect(leftMargin - 1, 10, 1, height - 29)
    ctx.fillRect(leftMargin + 3 * pointSpacing + 1, 10, 1, height - 29)


    logger.log("Generating graph")
    for (const entry of entries) {
        const [min, max] = getBounds(entry.values)
        const normalizeInner = (value) => {
            return ((value - min) / (max - min)) * (height - bottomMargin - topMargin) + bottomMargin
        }

        const minIcon = entry.icon.format(minValue, 4)
        const maxIcon = entry.icon.format(maxValue, 4)

        ctx.beginPath()
        ctx.strokeStyle = entry.stroke()
        ctx.lineWidth = 2
        const [rawValues, blockValues] = splitValues(entry)
        for (let i = 0; i < 4; i++) {
            { // Using indentation so I can reuse variable names.
            // Dumb I know, but hey, deal with it.
                const value = rawValues[i]
                const x = leftMargin + i * pointSpacing
                const y = height - normalizeInner(value)
                if (i === 0) ctx.moveTo(x, y)
                else ctx.lineTo(x, y)
            }

            if (i == 3) break
            const sub = blockValues[i]
            for (let j = 0; j < sub.length; ++j) {
                const value = sub[j]
                const x = leftMargin + i * pointSpacing + (j + 1) * (pointSpacing / (sub.length + 1))
                const y = height - normalizeInner(value)
                ctx.lineTo(x, y)
            }
        }
        ctx.stroke()

        if (entries.length > 1) continue

        ctx.lineTo(leftMargin + 3 * pointSpacing, height - 24)
        ctx.lineTo(leftMargin, height - 24)
        ctx.closePath()
        ctx.fillStyle = entry.fill()
        ctx.fill()
    }

    logger.log("Writing high and low")
    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]
        const [min, max] = getBounds(entry.values)

        ctx.fillStyle = entry.stroke()
        ctx.font = 'bold 15px Arial'

        ctx.fillText(`${entry.icon.format(max * 100, 4)}`, 2, topMargin + (i + 0.5) * 15 + 2)
        ctx.fillText(`${entry.icon.format(min * 100, 4)}`, 2, height - bottomMargin + (i + 0.5 - entries.length) * 15 + 12)

        ctx.fillText(`${entry.code}`, leftMargin + 3 * pointSpacing + 10, topMargin + (i) * 32 + 14)
        ctx.fillText(`${entry.icon.format(entry.values[0] * 100, 2)}`, leftMargin + 3 * pointSpacing + 12, topMargin + (i + 0.5) * 32 + 14)
    }
    ctx.fillStyle = 'white'
    ctx.font = 'bold 15px Arial'

    ctx.fillText('Max', 2, topMargin - 8)
    ctx.fillRect(2, topMargin - 7, ctx.measureText('Max').width, 2)

    ctx.fillText('Min', 2, height - bottomMargin - entries.length * 15 + 2)
    ctx.fillRect(2, height - bottomMargin - entries.length * 15 + 3, ctx.measureText('Min').width, 2)

    ctx.font = 'bold 14px Arial'
    ctx.fillText('Legend', leftMargin + 3 * pointSpacing + 10, topMargin - 5)
    ctx.fillRect(leftMargin + 3 * pointSpacing + 10, topMargin - 4, ctx.measureText('Legend').width, 2)

    logger.log("Writing image to disk")
    const filePath = `${graphPath}${name}.png`
    const buffer = canvas.toBuffer('image/png')
    await fs.writeFile(filePath, buffer)

    logger.log("Returning path")
    return filePath
}
