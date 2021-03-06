const Discord = require("discord.js");
const fs = require("fs");
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

const twentyFourHoursAsMillis = 24 * 360 * 1000;

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
    const userId = member.user.id;
    if (settings.authz.allowedUsersByUserId.includes(userId)) {
        return true;
    }

    // Try by role
    const hasMatchingRole = member.roles.cache.filter(r => settings.authz.allowedUsersByRoleId.includes(r));
    return hasMatchingRole;
}

async function startPollingTimers() {
    if (settings.timer.enabled === true) {
        if (settings.timer.executeCommands.length === 0) {
            console.log('Intervalometer enabled but no commands were specified. Nothing will be run.');
            return;
        }

        if (settings.postLogsToChannelId === "") {
            console.log(`Using the intervalometer requires "postLogsToChannelId" to be set to a valid channel.`);
            return;
        }

        const privateLogChannel = await client.channels.fetch(settings.postLogsToChannelId)
                                                        .catch(err => {
                                                            console.log(`Error fetching channel ID: ${settings.postLogsToChannelId}, intervalometer will not be enabled.\nError: ${err}`);
                                                            privateLogChannel = undefined;
                                                        });
        if (!privateLogChannel) {
            console.log(`Intervalometer enabled but the log channel ID (postLogsToChannelId) ${settings.postLogsToChannelId} did not point to a valid channel.`);
            return;
        }

        // If interval minutes is > 0 then we turn that feature on
        if (settings.timer.intervalMinutes > 0) {
            setupIntervalCommandTimer(settings.timer.intervalMinutes * 60 * 1000, false, privateLogChannel);
            console.log(`Intervalometer enabled, executing every ${settings.timer.intervalMinutes} minutes`);
        }
        else {
            console.log('Intervalometer enabled but intervalMinutes is less than the minimum of 1. Skipping.');
        }

        // If atSpecificTimes is > 0 then we turn that feature on
        if (settings.timer.atSpecificTimes.length > 0) {
            setupTimeOfDayTimers(privateLogChannel);
            console.log('Time-of-day timers are set up and will begin when their time approaches.');
        }
    }
}

function executeAllCommandsFromCommandList(logToChannel) {
    const commandList = settings.timer.executeCommands;
    commandList.forEach(cmd => {
        executeCommand(cmd, logToChannel);
    });
}

function setupIntervalCommandTimer(intervalMillis, executeCommandsOnSetup, logToChannel) {
    if (executeCommandsOnSetup === true) {
        console.log('Executing command list before starting timers...');
        executeAllCommandsFromCommandList(logToChannel);
    }

    setInterval(() => {
        executeAllCommandsFromCommandList(logToChannel);
    }, intervalMillis);
}

function setupTimeOfDayTimers(logToChannel) {
    const timeParse = /([\d]+):([\d]{2})/;
    const asHrsMins = settings.timer.atSpecificTimes.map(t => {
        const parts = timeParse.exec(t);
        if (!parts || parts.length !== 3) {
            throw `Invalid time-of-day value: ${t}`;
        }
        const hrs = parseInt(parts[1], 10);
        const mins = parseInt(parts[2], 10);

        if (mins > 59) {
            throw 'Cannot specify minutes over 59';
        }
        if (hrs > 23) {
            throw 'Cannot specify hours over 23';
        }

        return { hour: hrs, mins: mins };
    });

    const dtNow = new Date();
    const currentHour = dtNow.getHours();      // 24hr fmt
    const currentMins = dtNow.getMinutes();

    asHrsMins.forEach(t => {
        // Figure out how many millis until the specified time slot. We use this as a timeout value
        // before setting up our interval timer (which itself will run every 24hrs after the delay)
        const tDeltaHrs = currentHour <= t.hour ? t.hour - currentHour : (24 + (t.hour - currentHour));
        const tDeltaMins = currentMins <= t.mins ? t.mins - currentMins : (60 + (t.mins - currentMins));
        const delayMilliseconds = ((tDeltaHrs * 60) + tDeltaMins) * (60 * 1000);

        console.log(`Timer for ${t.hour}:${t.mins} will start after ${tDeltaHrs}h ${tDeltaMins}m`);
        setTimeout(() => {
            console.log(`Starting interval timer for time-of-day: ${t.hour}:${t.mins}`);
            setupIntervalCommandTimer(twentyFourHoursAsMillis, true, logToChannel);
        }, delayMilliseconds);
    });
}

function executeCommand(fullCommandString, channel) {
    const dtNow = new Date();
    cmdProcessor.processCommand(fullCommandString, channel)
        .then(function () {
            console.log(`${dtNow.toISOString()}: Executed ${fullCommandString} successfully`);
        })
        .catch(async function (err) {
            console.log(err);
            channel.send(err);
        });
}

client.once("ready", async () => {
    console.log("Starting...");
    await startPollingTimers();

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
