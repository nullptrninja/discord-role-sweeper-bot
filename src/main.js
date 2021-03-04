const Discord = require("discord.js");
const fs = require("fs");
const _ = require('underscore');
const CommandProcessor = require('./commandProcessor');
const RulesData = require("./rulesData");
const HelpCommand = require('./commands/helpCommand');
const ListCommand = require("./commands/listCommand");
const CleanUpCommand = require("./commands/cleanUpCommand");

const client = new Discord.Client();
const settings = JSON.parse(fs.readFileSync("production.settings.json"));
const rulesData = new RulesData(settings.rulesFile);

/*
    Cmdlet data dispatch map
*/
const cmdletDefinitions = [
    new HelpCommand(settings),
    new ListCommand(settings),
    new CleanUpCommand(settings)
];

const cmdProcessor = new CommandProcessor(rulesData, cmdletDefinitions, client, settings);

function isLongTriggerWord(content) {
    return content.toLowerCase().startsWith(settings.command.longTriggerWord + ' ');
}

function isUserIdOnWhitelist(messageAuthor) {
    let userId = messageAuthor.id;
    return settings.allowedUsersById.includes(userId);
}

function executeCommand(fullCommandString, channel) {
    cmdProcessor.processCommand(fullCommandString, channel)
        .then(function() {
            console.log(`Executed ${fullCommandString} successfully`);
        })
        .catch(async function(err) {
            console.log(err);

            if (!_.isEmpty(settings.postLogsToChannelId)) {
                const channel = await client.channels.fetch(settings.postLogsToChannelId)
                if (channel) {
                    channel.send(err.message);
                }
            }
        });
}

client.once("ready", () => {
    console.log("Role Sweeper bot ready to clean up ya gah-bage!");
});

client.on("message", message => {
    if (message.author.bot) {
        return;
    }

    var inputCommand = message.content;

    if (!isLongTriggerWord(inputCommand)) {
        // NOOP
        return;
    }

    if (!isUserIdOnWhitelist(message.author)) {
        console.log(`UserId ${message.author.id} was not on the allowed users whitelist but tried to execute a command`);
        message.channel.send('You can\'t run that command');
        return;
    }

    executeCommand(inputCommand, message.channel);
});

client.login(settings.token);
