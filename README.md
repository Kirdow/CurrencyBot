# Currency Bot [![License](https://img.shields.io/github/license/Kirdow/CurrencyBot.svg)](https://github.com/Kirdow/CurrencyBot/blob/master/LICENSE)
Discord Bot made by Kirdow to convert currencies.

# Slash Commands
These are the supported slash commands as of 2024-02-20.

### /currency
This follow the same format as messages seen below.<br>
However `Convert` and `Scheme` should prefer using `/convert` and `/scheme` commands for better support.

### /convert
```
/convert <value> <from> [to]
```
Converts between currency `<from>` to currency `[to]` with `<value>` as input value.

### /scheme
```
/scheme <currency> [reference]
```
Shows the current `100X = Y || 100Y = X` as well as a graph for the past 3 months, 1 months, 1 week and 24 hours with values in between.<br>
Graph needs to be cached using a channel specified in dotenv (`.env`) prior to delivering the response.

The source currency is specified with `<currency>` and the reference currency is default to EUR unless otherwise specified in `[reference]`.

# Supported Messages *(deprecated as of 2024-02-20)*
These are the supported messages as of 2024-02-13.

### Convert
```
<value> <code>[[ <in|to|as>] <code>]
```
Converts ``<value>`` from the first ``<code>`` currency to the second ``<code>`` currency. If the second ``<code>`` is omitted it defaults to EUR.

### Scheme
```
$<code>
```
Converts 100 ``<code>`` to EUR and 100 EUR to ``<code>``.

# How do I run this?
First off, make sure you got a discord bot on your [Discord Dashboard](https://discord.com/developers/applications). You will need the Application/Client ID found under General Information as well as your Token found under Bot section.

When you have your discord bot token and client id, create a ``.env`` file in the root directory of the repository, next to the app.js file etc.

The file should look like this
```
CTOKEN="<token goes here>"
CCLIENT_ID="<client id goes here>"
GRAPH_CACHE_CHANNEL="<cache channel id goes here>"
```

## Running the bot manually
Once you got that done, you can start the bot using
```sh
$ /path/to/node app.js
```

## Running the bot using a Linux Daeomon Service
Optionally you can also run it as a service. I use Linux for my hosting needs so I will show using systemd.
```ini
[Unit]
Description=CurrencyBot
After=network.target
[Service]
WorkingDirectory=/path/to/currencybot
User=username
Group=username
Type=simple
ExecStart=/path/to/node /path/to/currencybot/app.js
TimeoutSec=30
RestartSec=15s
Restart=always
KillSignal=SIGINT
[Install]
WantedBy=multi-user.target
```
On Ubuntu, save this to ``/etc/systemd/system/currencybot.service``, then run the following to reload the daemon configs:
```sh
# You will need to reload daemon configs every time you edit a .service file
$ sudo systemctl daemon-reload
```

To manage the bot state, run one of the following
```sh
# Start/Stop/Restart the bot
$ sudo systemctl <start|stop|restart> currencybot

# Enable/Disable auto start on system boot
$ sudo systemctl <enable|disable> currencybot

# Check the status of the bot
$ sudo systemctl status currencybot
```

To check the logs, run one of the following
```sh
# Check the logs from the moment the bot service was created.
# Note: You can skip to latest by pressing G (capital g).
$ sudo journalctl -u currencybot

# Tail the logs, automatically polling for the latest output.
$ sudo journalctl -u currencybot -f
```

# License
Currency Bot is licensed under the license [MIT License](https://github.com/Kirdow/CurrencyBot/blob/master/LICENSE)
