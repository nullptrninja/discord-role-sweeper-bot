# discord-role-sweeper-bot
A bot that cleans up Discord Roles using a simple set of relational rules

## Installation
### Prerequisites
- NodeJS 12 or higher
- Discord bot already setup

### Manual installation
1. Pull down this repo
2. Make a copy of `template.settings.json` and name the file `production.settings.json`:
3. Open `production.settings.json` and make the following changes:
  - `token`: Fill in your Discord bot Token here
  - `guildId`: Your Guild/Server ID goes here
  - `rulesFile`: By defaul this is `currentRules.json` but you can change it to whatever you'd like. This is the file that your rules are saved/loaded from.
4. Authorization: In the same JSON settings file you'll see 2 fields. You must give someone access to interact with the bot, either by specific User IDs or by Role ID.
  - `authz.allowedUsersById`: Add the UserIDs of the users allowed to talk to this bot.
  - `authz.allowedRolesById`: Add the RoleIDs allowed to talk to this bot.
5. Timers allow the bot to execute a series of commands at either fixed intervals from when the bot was first started or at specific times of the day. If you're using timers, then you'll need to set `postLogsToChannelId` to a channel.
  - `timer.enabled`: Set to true to use timers.
  - `timer.postLogsToChannelId`: The channel ID that the timer will communicate on. Most of the time you'll probably want this to be a private channel so that other users don't see any messages the bot produces. This is a required field.
  - `timer.intervalMinutes`: Runs commands every X minutes since bot start. Set to 0 to disable.
  - `timer.atSpecificTimes`: Runs commands at specific times of the day. Use `hh:mm` format. You can set multiple times of the day. Make into a blank array to disable.
  - `timer.executeCommands`: An array of commands to execute when either timer fires. These are the same commands that you would type into Discord manually.
6. Save and close the settings file.
7. Add your bot to the server via OAuth URL. You will need the following permission on your OAuth URL: `268438528`
  - This encompases: `Manage Roles`, `View Channels`, `Send Messages`
  - Ex: https://discord.com/api/oauth2/authorize?client_id=CLIENT_ID&scope=bot&permissions=268438528
  - Under the BOT menu in Discord's Bot configuration page, and enable `Presence Intent` and `Server Members Intent` permissions.
8. When the bot joins your server, go to `Server Settings` -> `Roles` and find the role created by the bot. Move the role's position as high as you need to - this will usually be higher than the roles you plan to have the bot remove. It's not advised that you give the bot more permissions than required, for example you probably don't want to make its role higher than a "mod" role - this implies that the bot _can_ remove `mod` from someone automatically.
9. Run `npm install`
10. Run `node src/main.js`
11. Run a test command to ensure it's working: `purge! help`
