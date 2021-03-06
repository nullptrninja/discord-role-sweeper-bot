const Discord = require("discord.js");
const fs = require("fs");
const _ = require('underscore');
const CommandProcessor = require('./commandProcessor');
const RulesData = require("./rulesData");
const HelpCommand = require('./commands/helpCommand');
const ListCommand = require("./commands/listCommand");
const CleanUpCommand = require("./commands/cleanUpCommand");
const AddRuleCommand = require("./commands/addRuleCommand");
const DeleteRuleCommand = require("./commands/deleteRuleCommand");

const client = new Discord.Client();
const settings = JSON.parse(fs.readFileSync("production.settings.json"));
const rulesData = new RulesData(settings.rulesFile);

/*
    Cmdlet data dispatch map
*/
const cmdletDefinitions = [
    new HelpCommand(settings),
    new ListCommand(settings),
    new CleanUpCommand(settings),
    new AddRuleCommand(settings),
    new DeleteRuleCommand(settings)
];

const cmdProcessor = new CommandProcessor(rulesData, cmdletDefinitions, client, settings);

function isLongTriggerWord(content) {
    return content.toLowerCase().startsWith(settings.command.longTriggerWord + ' ');
}

function isUserAllowedToCommand(member) {
    // Check whitelist ID first
    let userId = member.user.id;
    if (settings.allowedUsersByUserId.includes(userId)) {
        return true;
    }

    // Try by role
    const hasMatchingRole = member.roles.cache.filter(r => settings.allowedUsersByRoleId.includes(r));
    return hasMatchingRole;
}

function executeCommand(fullCommandString, channel) {
    cmdProcessor.processCommand(fullCommandString, channel)
        .then(function() {
            console.log(`Executed ${fullCommandString} successfully`);
        })
        .catch(async function(err) {
            console.log(err);

            if (!_.isEmpty(settings.postLogsToChannelId)) {
                const privateLogChannel = await client.channels.fetch(settings.postLogsToChannelId)
                if (privateLogChannel) {
                    privateLogChannel.send(err);
                }
            }
            else {
                channel.send(err);
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

    if (!isUserAllowedToCommand(message.member)) {
        console.log(`UserId ${message.author.id} was not on the allowed users whitelist but tried to execute a command`);
        message.channel.send('You can\'t run that command');
        return;
    }



    executeCommand(inputCommand, message.channel);
});

client.login(settings.token);
