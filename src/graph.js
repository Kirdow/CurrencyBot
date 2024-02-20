import { createCanvas } from "canvas";
import fs from 'fs/promises';
import 'dotenv/config'
import path from 'path'

const graphPath = './files/graph/';

await fs.mkdir(graphPath, { recursive: true });

export async function generateAndCacheGraph({ values, bot, name, logger, icon }) {
    try {
        logger.log(`Generating graph image ${name}`)
        const path = await generateGraphImage({ icon, values, name, logger })
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

export async function generateGraphImage({ icon, values, name, logger }) {
    // A lot of values in this function is hardcoded.
    // For initial implementation I only care about it working.
    // I will fix this in a later commit.

    logger.log("Generating graph canvas")

    const width = 500
    const height = 300
    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')

    const rawValues = values.filter(p => typeof p === 'number')
    const blockValues = values.filter(Array.isArray)

    ctx.fillStyle = 'rgba(0, 0, 0, 0)'
    ctx.fillRect(0, 0, width, height)

    const [minValue, maxValue] = getBounds(values)

    const minIcon = icon.format(minValue, 4)
    const maxIcon = icon.format(maxValue, 4)

    const topMargin = height * 0.1
    const bottomMargin = height * 0.25

    const leftMargin = width * 0.15
    const rightMargin = width * 0.05
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
    ctx.beginPath()
    ctx.strokeStyle = '#00FFFF'
    ctx.lineWidth = 2
    for (let i = 0; i < 4; i++) {
        { // Using indentation so I can reuse variable names.
          // Dumb I know, but hey, deal with it.
            const value = rawValues[i]
            const x = leftMargin + i * pointSpacing
            const y = height - normalize(value)
            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
        }

        if (i == 3) break
        console.log(blockValues)
        const sub = blockValues[i]
        for (let j = 0; j < sub.length; ++j) {
            const value = sub[j]
            const x = leftMargin + i * pointSpacing + (j + 1) * (pointSpacing / (sub.length + 1))
            const y = height - normalize(value)
            ctx.lineTo(x, y)
        }
    }
    ctx.stroke()

    ctx.lineTo(leftMargin + 3 * pointSpacing, height - 24)
    ctx.lineTo(leftMargin, height - 24)
    ctx.closePath()
    ctx.fillStyle = 'rgba(0, 255, 255, 0.4)'
    ctx.fill()

    logger.log("Writing high and low")
    ctx.fillStyle = 'white'
    ctx.font = 'bold 14px Arial'
    ctx.fillText(`${maxIcon}`, 5, height - normalize(maxValue) + 7)
    ctx.fillText(`${minIcon}`, 5, height - normalize(minValue) + 7)

    logger.log("Writing image to disk")
    const filePath = `${graphPath}${name}.png`
    const buffer = canvas.toBuffer('image/png')
    await fs.writeFile(filePath, buffer)

    logger.log("Returning path")
    return filePath
}
