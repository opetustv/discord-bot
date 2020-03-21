# Opetus.tv's Discord bot

Currently only used for assigning an audio channel talk role (once) for all users. Should moderators remove the permission, then it will not be reassigned by the bot.

## Getting started

1. `git clone https://github.com/opetustv/discord-bot.git opetustv-discord-bot`
2. `cd opetustv-discord-bot`
3. `npm install`
4. You need a security token for your app. You'll place it in `.env.tmpl` and rename the file to `.env`. You'll create the token at https://discordapp.com/developers/applications and can for example follow along one of these articles in doing so:
    - https://github.com/reactiflux/discord-irc/wiki/Creating-a-discord-bot-&-getting-a-token
    - https://www.howtogeek.com/364225/how-to-make-your-own-discord-bot/
5. Add the bot to a channel you manage
6. Run the bot using `node bot.js`

## Documentation regarding `discord.js`

The documentation at https://discord.js.org is partially ok, at least for class attributes, but at least some of the method signatures listed there are simply incorrect/out-of-date. The best place to check method signatures is to read the TypeScript declarations from `node_modules/discord.js/typings/index.d.ts` after running `npm install`.

## Version history

- v0.0.1, 2020-03-19, initial version
