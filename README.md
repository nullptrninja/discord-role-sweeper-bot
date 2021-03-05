# discord-role-sweeper-bot
A bot that cleans up Discord Roles using a simple set of relational rules

## Installation
### Prerequisites
- NodeJS 12 or higher
- Discord bot already setup

### Manual installation
1. Pull down this repo
2. Make a copy of `template.settings.json` and name the file `production.settings.json`:
  - Ex: `cp template.settings.json production.settings.json`
4. Make a copy of `template.rules.json` and name the file `currentRules.json`
  - Ex: `cp template.rules.json currentRules.json`
6. Open `production.settings.json` and make the following changes:
  - `token`: Fill in your Discord bot Token here
  - `guildId`: Your Guild/Server ID goes here
  - `postLogsToChannelId`: Make empty `""` if you want bot feedback published to the same channel you executed the command on. Otherwise use a channel ID for private feedback messages.
  - `allowedUsersById`: Add the UserIDs of the users allowed to talk to this bot.
  - `rulesFiles`: Change this to the name of your rules file you copied, ex: `currentRules.json`
7. Save and close the settings file.
8. Add your bot to the server via OAuth URL. You will need the following permission on your OAuth URL: `268438528`
  - This encompases: `Manage Roles`, `View Channels`, `Send Messages`
  - Ex: https://discord.com/api/oauth2/authorize?client_id=CLIENT_ID&scope=bot&permissions=268438528
9. When the bot joins your server, go to `Server Settings` -> `Roles` and find the role created by the bot. Move the role's position as high as you need to - this will usually be higher than the roles you plan to have the bot remove. It's not advised that you give the bot more permissions than required, for example you probably don't want to make its role higher than a "mod" role - this implies that the bot _can_ remove `mod` from someone automatically.
11. Run `npm install`
12. Run `node src/main.js`
13. Run a test command to ensure it's working: `purge! help`
