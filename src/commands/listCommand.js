const JoinOps = require('../joinOperator');
const DiscordHelper = require('../discordHelper');

class ListCommand {
    constructor(settings) {
        this._settings = settings;

        this.name = "list";

        this.params = [
            { name: 'rules', isRequired: true, isSwitch: true, isGlob: false, position: 0 },
            { name: 'victims', isRequired: true, isSwitch: true, isGlob: false, position: 0 }
        ];

        this.helpText = `Usage: *${settings.command.longTriggerWord} ${this.name}* [\`rules|victims\`]\n
\`rules\`: Shows all clean up rules\n
\`victims\`: Shows all users that would have roles cleaned up under each defined rule. Note, this can be a large list!\n`;
    }

    async asyncHandler(channel, commandContext, discordClient, cmdProc) {
        const showRules = commandContext.params['rules'];
        const showVictims = commandContext.params['victims'];

        if (showRules === true) {
            const allRules = cmdProc.rulesData.rules;

            const mappedRules = allRules.map(r => {
                // r is a RuleModel
                let joinChar = JoinOps[r.joinWith] || '?';              // This should warn us of a formating error
                let allDeps = r.dependsOn.map(d => { return `\`${d}\``; }).join(` ${joinChar} `);
                return `Rule: \`${r.name}\` Role: \`${r.targetRole}\` depends on ${allDeps}`;
            }).join('\n');

            channel.send(`Currently configured rules:\n${mappedRules}`, { split: true });
        }
        else if (showVictims === true) {
            const helper = new DiscordHelper(discordClient, this._settings);
            const allRules = cmdProc.rulesData.rules;
            const guild = await helper.getGuild();

            // This one's a bit messy
            const mappedRules = allRules.map(r => {
                // r is a RuleModel
                let joinChar = JoinOps[r.joinWith] || '?';              // This should warn us of a formating error
                let allDeps = r.dependsOn.map(d => { return `\`${d}\``; })
                                         .join(` ${joinChar} `);
                return {
                    asString: `\`${r.targetRole}\` -> ${allDeps}`,
                    targetRole: r.targetRole.toLowerCase()
                };
            });

            const ruleSummary = mappedRules.map( rule => {
                const role = guild.roles.cache.find(role => role.name.toLowerCase() === rule.targetRole);
                var mappedUsersInRole = [];
                if (role) {
                    mappedUsersInRole = role.members.map(m => m.user.tag);
                }

                return { rule: rule, users: mappedUsersInRole };
            });

            ruleSummary.forEach(ruleGrouping => {
                const userList = ruleGrouping.users.join('\n');
                channel.send(`Rule: ${ruleGrouping.rule.asString}\nUsers to be checked:\`\`\`\n${userList}\`\`\``, { split: true });
            });
        }
    }
}

module.exports = ListCommand;
