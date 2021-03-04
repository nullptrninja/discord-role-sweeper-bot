const JoinOps = require('../joinOperator');
const DiscordHelper = require('../discordHelper');

class CleanUpCommand {
    constructor(settings) {
        this._settings = settings;

        this.name = "clean";

        this.params = [
            { name: 'test', isRequired: false, isSwitch: true, isGlob: false, position: 0 },
        ];

        this.helpText = `Usage: *${settings.command.longTriggerWord} ${this.name} [\`test\`]*\nRuns all clean up rules\n
\`test\`: if specified, shows who will be affected without taking any action`;
    }

    _shouldKeepRole(member, rule) {
        const allRolesForMember = member.roles.cache.map(r => `${r.name.toLowerCase()}`);

        // Check the rule whitelist first
        const whitelistedRolesOnMember = allRolesForMember.filter(r => rule.whitelistByRoleName.includes(r.toLowerCase()));
        if (whitelistedRolesOnMember.length > 0) {
            return true;
        }

        const requiredRolesForRule = rule.dependsOn.map(r => `${r.toLowerCase()}`);
        const roleIntersection = allRolesForMember.filter(r => requiredRolesForRule.includes(r));

        // Note: Operators are handled here. Add new ops here!
        const joinOp = JoinOps[rule.joinWith];
        if (joinOp === JoinOps.or) {
            // Any specified role is good enough
            const hasAnyDependentRole = roleIntersection.length > 0;
            return hasAnyDependentRole;
        }
        else if (joinOp === JoinOps.and) {
            // Must have all roles specified
            const hasAllDependentRoles = roleIntersection.length === requiredRolesForRule.length;
            return hasAllDependentRoles;
        }

        throw `Unrecognized join operator: ${rule.joinWith}`;
    }

    async asyncHandler(channel, commandContext, discordClient, cmdProc) {
        const isTestMode = commandContext.params['test'] === true;
        const helper = new DiscordHelper(discordClient, this._settings);
        const allRules = cmdProc.rulesData.rules;

        // Doing this with a bunch of async callbacks looks like a bag of dicks (or most likely that I'm just too noob at dealing with promises)
        for (var i = 0; i < allRules.length; ++i) {
            const currentRule = allRules[i];
            const targetRole = currentRule.targetRole;
            const membersInRole = await helper.getAllMembersForRole(targetRole, currentRule.whitelistByUserId);

            var affectedMembers = [];
            for (var k = 0; k < membersInRole.length; ++k) {
                const currentMember = membersInRole[k];
                const shouldKeepRole = this._shouldKeepRole(currentMember, currentRule);
                if (shouldKeepRole === false) {
                    affectedMembers.push(currentMember);
                }
            }

            // Test mode just prints a summary
            if (isTestMode) {
                channel.send('Running in TEST mode. Nothing will actually be cleaned up.');
                const removalSummary = affectedMembers.map(m => `Rule would remove role: \`${targetRole}\` from user: \`${m.user.tag}\``).join('\n')
                if (!removalSummary || removalSummary.length === 0)
                {
                    channel.send(`No users would be removed by Rule: \`${currentRule.name}\``);
                }
                else {
                    channel.send(removalSummary, { split: true });
                }
            }
            else {
                // Do the real thing
                affectedMembers.forEach(m => {
                    // Note: If the bot's role is lower in position than the role its trying to remove, you're going to get an insufficient permissions error from Discord
                    const roleToRemove = helper.getRoleFromMemberByRoleName(m, targetRole);
                    m.roles.remove(roleToRemove).then(_ => {
                        const msg = `:knife: Removed role: \`${roleToRemove.name}\` from \`${m.user.tag}\` by rule: \`${currentRule.name}\``;
                        console.log(msg);
                        channel.send(msg);
                    })
                    .catch(err => {
                        const msg = `:red_circle: Could not remove role: \`${roleToRemove.name}\` from \`${m.user.tag}\` via rule: \`${currentRule.name}\` because: ${err}`;
                        console.log(msg);
                        channel.send(msg);
                        throw err;
                    });
                });
            }
        }
    }
}

module.exports = CleanUpCommand;
