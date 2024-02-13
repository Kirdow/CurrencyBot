# Currency Bot [![License](https://img.shields.io/github/license/Kirdow/CurrencyBot.svg)](https://github.com/Kirdow/CurrencyBot/blob/master/LICENSE)
Discord Bot made by Kirdow to convert currencies.

# Supported Messages
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
On Ubuntu, save this to ``/etc/systemd/system/currencybot.service``, then run the following to reload the daemon configs (you will need to reload daemon configs always when editing .service files):
```sh
$ sudo systemctl daemon-reload
```

To manage the bot state, run the following
```sh
$ sudo systemctl <start|stop|restart|status|enable|disable> currencybot
```

To check the logs, run one of the following
```sh
$ sudo journalctl -u currencybot
$ sudo journalctl -u currencybot -f
```

# License
Currency Bot is licensed under the license [MIT License](https://github.com/Kirdow/CurrencyBot/blob/master/LICENSE)
