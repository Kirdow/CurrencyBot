const fs = await import('fs')
import { REST, Routes, Client } from 'discord.js'
import 'dotenv/config'

export function createBot(opts) {
    const token = process.env[`${opts.authPrefix}TOKEN`]
    const clientId = process.env[`${opts.authPrefix}CLIENT_ID`]
    const rest = new REST({ version: '10' }).setToken(token)
    ;(async() => {
        if (opts.commands) {
            try {
                console.log('Started refreshing application (/) commands.')

                await rest.put(Routes.applicationCommands(clientId), { body: opts.commands })

                console.log('Successfully reloaded application (/) commands.')
            } catch (error) {
                console.error(error)
            }
        }
    })();

    const client = new Client({ intents: opts.intents || [], partials: opts.partials || [], rest: rest })
    const loggerFilter = (text) => {
        text = text.toLowerCase();
        if (text.includes('sending a heartbeat')) return true
        if (text.includes('heartbeat acknowledged')) return true

        return false
    };

    let name = 'Unknown'
    client.on('error', err => {
        console.error(`Discord Error [${name}]:`, err)
    })
    client.on('warn', wrn => {
        console.warn(`Discord Warning [${name}]:`, wrn)
    })
    client.on('debug', dbg => {
        if (loggerFilter(dbg)) return;
        console.debug(`Discord Debug [${name}]:`, dbg)
    })
    client.on('ready', () => {
        name = client.user.username
        if (opts.ready) {
            try {
                opts.ready(client)
            } catch (error) {
                console.log(error)
            }
        }
    })

    if (opts.eventsCallback) {
        try {
            opts.eventsCallback(client)
        } catch (error) {
            console.error(error)
        }
    }

    client.login(token)
    
    return client
}
