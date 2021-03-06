const JoinOps = require('../joinOperator');
const DiscordHelper = require('../discordHelper');
const RuleModel = require('../ruleModel');

class DeleteRuleCommand {
    constructor(settings) {
        this._settings = settings;

        this.name = "del";

        // Because our command processor doesn't support this type of command parsing, we read the entirety of the command parameter
        // as a string and perform special parsing afterwards.
        this.params = [
            { name: 'ruleName', isRequired: true, isSwitch: false, isGlob: false, position: 0 },
        ];

        this.helpText = `Usage: *${settings.command.longTriggerWord} ${this.name} \`rule_name\`
\`ruleName\`: the name of the rule to delete. Rule names cannot have spaces.\n`;
    }

    async asyncHandler(channel, commandContext, discordClient, cmdProc) {
        const ruleName = commandContext.params['ruleName'];

        if (!cmdProc.rulesData.containsRule(ruleName)) {
            channel.send(`Rule: \`${ruleName}\` not found. Rule names are case sensitive and cannot contain spaces.`);
            return;
        }

        const deleteResult = cmdProc.rulesData.removeRule(ruleName);
        cmdProc.rulesData.saveFile();

        if (deleteResult === true) {
            channel.send(`Removed rule: \`${ruleName}\``);
        }
        else {
            // Edge case
            channel.send(`Could not remove rule: \`${ruleName}\` - it could not be found.`);
        }
    }
}

module.exports = DeleteRuleCommand;
