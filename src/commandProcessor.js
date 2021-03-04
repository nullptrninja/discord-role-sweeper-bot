const _ = require('underscore');

class CommandProcessor {
    constructor(rulesFile, cmdlets, discordClient, settings) {
        this.rulesData = rulesFile;
        this._cmdlets = cmdlets;
        this._discordClient = discordClient;
        this._settings = settings;
    }

    getCmdletDefinition(cmdletName) {
        let cmdletToLower = cmdletName.toLowerCase();
        return _.find(this._cmdlets, function(cmd) {
            return cmd.name === cmdletToLower;
        });
    }

    async processCommand(userInput, srcChannel) {
        var parseResults = this._parseCommandTokens(userInput);
        if (parseResults.errorMessage) {
            throw parseResults.errorMessage;
        }
        else {
            await parseResults.cmdlet.asyncHandler(srcChannel, parseResults, this._discordClient, this);
        }
    }

    _parseCommandTokens(fullContentString) {
        let tokens = fullContentString.split(' ');

        // First token is triggerCommand, we don't need to validate that again so skip it.
        if (tokens.length > 1) {
            let cmdlet = this.getCmdletDefinition(tokens[1]);
            if (cmdlet) {
                let paramTokens = tokens.slice(2);
                let requiredParams = _.uniq(_.filter(cmdlet.params, function(c) {
                                                 return c.isRequired === true;
                                            }),
                                            function(param) {
                                                 return param.position;
                                            });

                // Must meet minimum length requirements
                if (paramTokens.length < requiredParams.length) {
                    return { errorMessage: `We think you wanted the \`${cmdlet.name}\` command, but you're missing some parameters.` };
                }

                var paramsTable = {};
                var globValue = null;
                var globedParamName = null;
                var captureRemainderAsGlob = false;
                for (var i = 0; i < paramTokens.length; ++i) {
                    let paramValue = paramTokens[i].toLowerCase();

                    // Find all applicable parameters at this position i
                    let applicableParams = _.filter(cmdlet.params, function(p) { return p.position === i; });

                    if (!applicableParams) {
                        throw `Parameter: ${paramValue} is not applicable on position: ${i}.`
                    }

                    for (var k = 0; k < applicableParams.length; ++k) {
                        let paramSpec = cmdlet.params[k];
                        var assignedParamValue = null;

                        if (paramSpec) {
                            if (paramSpec.isGlob === false) {
                                if (paramSpec.isSwitch === true) {
                                    // For switches, we'll just require you to match the name of the switch to turn it on.
                                    assignedParamValue = paramSpec.name === paramValue ? true : false;
                                }
                                else {
                                    assignedParamValue = paramValue;
                                }
                            }
                            else {
                                // Globs capture the remainder of the command as long string buffer. We ignore positional asserts after this point
                                captureRemainderAsGlob = true;
                                globedParamName = paramSpec.name;
                                globValue = [ paramValue ];
                                continue;
                            }

                            paramsTable[paramSpec.name] = assignedParamValue;
                        }
                        else if (captureRemainderAsGlob) {
                            globValue.push(paramValue);
                        }
                    }

                    // Concat the Glob
                    if (captureRemainderAsGlob === true) {
                        paramsTable[globedParamName] = globValue.join(' ');
                    }
                }

                return {
                    command: cmdlet.name,
                    cmdlet: cmdlet,
                    params: paramsTable
                };
            }

            return { errorMessage: "We don\'t recognize that command." };
        }
        else {
            return { errorMessage: "You need to specify a command." };
        }
    }
}

module.exports = CommandProcessor;
