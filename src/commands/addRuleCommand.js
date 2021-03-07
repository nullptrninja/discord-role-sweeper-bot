const JoinOps = require('../joinOperator');
const RuleModel = require('../ruleModel');

const nameParam = '-n';
const targetRoleParam = '-r';
const dependsOnParam = '-d';
const joinParam = '-j';
const whitelistRolesParam = '-w';
const whitelistUsersParam = '-u';

class AddRuleCommand {
    constructor(settings) {
        this._settings = settings;

        this.name = "add";

        // Because our command processor doesn't support this type of command parsing, we read the entirety of the command parameter
        // as a string and perform special parsing afterwards.
        this.params = [
            { name: 'expression', isRequired: true, isSwitch: false, isGlob: true, position: 0 },
        ];

        this.helpText = `Usage: *${settings.command.longTriggerWord} ${this.name} \`-n rule_name\` \`-r role name\` \`-d role name 1, role name 2\` \`-j [and | or]\` \`-w role name 1, role name 2\` \`-u 123, 456\`*\n
\`${nameParam}\`: Required; the name of the rule. No spaces.
\`${targetRoleParam}\`: Required; the name of the role to be removed on rule match.
\`${dependsOnParam}\`: Required: name of roles that the targeted role requires to exist to avoid removal. Separate roles with a comma.
\`${joinParam}\`: Optional: how to join the dependent roles together; \`and\`: all roles must exist, \`or\`: at least one role must exist. Defaults to \`or\` if omitted.
\`${whitelistRolesParam}\`: Optional: whitelisted role names on users that this rule will not apply to.
\`${whitelistUsersParam}\`: Optional: whitelisted user IDs that this rule will not apply to.\n`;
    }

    async asyncHandler(channel, commandContext, discordClient, cmdProc) {
        const unparsedCommand = commandContext.params['expression'];
        const argTokens = unparsedCommand.split(/[\s]?(-[nrdjwu])\s/);

        var currentMode = '';
        var self = this;
        var modeHandlers = {};
        modeHandlers[nameParam] = function (t) {
            if (self._verifySingleString(t)) {
                const name = self._readSingleString(t);

                // Check name doesn't already exist
                if (cmdProc.rulesData.containsRule(name)) {
                    return { error: `The rule ${name} already exists.` };
                }

                return name;
            }
            return { error: 'value cannot be empty, contain spaces, or contain multiple entries' };
        };
        modeHandlers[targetRoleParam] = function (t) {
            if (self._verifyMultiString(t)) {
                return self._readSingleString(t);
            }
            return { error: 'value cannot be empty' };
        };
        modeHandlers[dependsOnParam] = function (t) {
            if (self._verifyMultiString(t)) {
                return self._readMultiString(t);
            }
            return { error: 'value cannot be empty or contain multiple entries' };
        };
        modeHandlers[joinParam] = function (t) {
            const choices = ['and', 'or'];
            if (self._verifyMultipleChoice(t, choices)) {
                return self._readNormalizedString(t);
            }
            return { error: `value must be one of these: \`${choices.join(', ')}\`` };
        };
        modeHandlers[whitelistRolesParam] = function (t) {
            if (self._verifyMultiString(t)) {
                return self._readMultiString(t);
            }
            return { error: 'value cannot be empty' };
        };
        modeHandlers[whitelistUsersParam] = function (t) {
            if (self._verifyMultiString(t)) {
                return self._readMultiString(t);
            }
            return { error: 'value cannot be empty' };
        };

        var assignedParams = {};

        for (var i = 0; i < argTokens.length; ++i) {
            const token = argTokens[i];

            // Dead token, probably leading whitespace
            if (token === '' && currentMode === '') {
                continue;
            }

            // Searching for a parameter
            if (currentMode === '') {
                const normalizedToken = token.toLowerCase();
                if (modeHandlers.hasOwnProperty(normalizedToken)) {
                    currentMode = normalizedToken;
                }
            }
            else {
                const results = modeHandlers[currentMode](token);
                if (results.error) {
                    channel.send(`Error for parameter: ${currentMode}: ${results.error}`);
                    throw 'Failed to add rule.';
                }
                else {
                    assignedParams[currentMode] = results;
                }

                currentMode = '';
            }
        }

        // Verify we have all we need and back fill optionals
        var errorLog = [];
        this._assertRequiredProperty(assignedParams, nameParam, errorLog);
        this._assertRequiredProperty(assignedParams, targetRoleParam, errorLog);
        this._assertRequiredProperty(assignedParams, dependsOnParam, errorLog);
        this._backfillOptionalProperty(assignedParams, joinParam, 'or');
        this._backfillOptionalProperty(assignedParams, whitelistRolesParam, []);
        this._backfillOptionalProperty(assignedParams, whitelistUsersParam, []);

        if (errorLog.length > 0) {
            errorLog.forEach(e => channel.send(e));
        }
        else {
            // TODO: TEST ONLY
            const rule = new RuleModel(assignedParams[nameParam],
                                       assignedParams[targetRoleParam],
                                       assignedParams[dependsOnParam],
                                       assignedParams[joinParam],
                                       assignedParams[whitelistUsersParam],
                                       assignedParams[whitelistRolesParam]);

            cmdProc.rulesData.addRule(rule);
            cmdProc.rulesData.saveFile();

            const outputIgnoreUsers = rule.whitelistByUserId.length > 0 ? rule.whitelistByUserId.join(',') : 'None';
            const outputIgnoreRules = rule.whitelistByRoleName.length > 0 ? rule.whitelistByRoleName.join(',') : 'None';
            const summary = `\nAdded new rule::
Name: \`${rule.name}\`
Role: [\`${rule.targetRole}\`]  ---depends-on--->  \`${rule.dependsOn.join(` ${JoinOps[rule.joinWith]} `)}\`
Ignore Users: \`${outputIgnoreUsers}\`
Ignore Roles: \`${outputIgnoreRules}\``;

            channel.send(summary, { split: true });
        }
    }

    _assertRequiredProperty(obj, propName, errLog) {
        if (!obj.hasOwnProperty(propName)) {
            errLog.push(`Missing required parameter: ${propName}`);
        }
    }

    _backfillOptionalProperty(obj, propName, defaultIfMissing) {
        if (!obj.hasOwnProperty(propName)) {
            obj[propName] = defaultIfMissing;
        }
    }

    _verifyMultipleChoice(token, choices) {
        return choices.includes(token.trim().toLowerCase());
    }

    _verifySingleString(token) {
        return this._verifySingleStringWithSpaces(token) && !token.includes(' ');
    }

    _verifySingleStringWithSpaces(token) {
        if (!token) {
            return false;
        }

        const trimmed = token.trim();
        if (trimmed.length == 0) {
            return false;
        }

        return !trimmed.includes(', ');
    }

    _verifyMultiString(token) {
        if (!token) {
            return false;
        }

        const trimmed = token.trim();
        if (trimmed.length == 0) {
            return false;
        }

        return true;
    }

    _readSingleString(token) {
        return token.trim();
    }

    _readMultiString(token) {
        const asTokens = token.split(',').map(t => t.trim());
        return asTokens;
    }

    _readNormalizedString(token) {
        return token.trim().toLowerCase();
    }
}

module.exports = AddRuleCommand;
