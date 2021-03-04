const fs = require("fs");
const _ = require('underscore');
const RuleModel = require("./ruleModel");

class RulesData {
    constructor(rulesFilePath) {
        this._loadRules(rulesFilePath);
    }

    _tryCreateBlankFile(rulesFilePath) {
        try {
            if (fs.existsSync(rulesFilePath) === false) {
                console.log(`Rules file ${rulesFilePath} not found, creating new one.`);

                const blankRules = '{\n\t"rules": []\n}\n';
                fs.writeFileSync(rulesFilePath, blankRules);
            }
        }
        catch(err) {
            throw err;
        }
    }

    _loadRules(rulesFilePath) {
        this._tryCreateBlankFile(rulesFilePath);

        let rawRules = JSON.parse(fs.readFileSync(rulesFilePath));
        if (_.isUndefined(rawRules)) {
            console.log(`Could not load rules data: ${rulesFilePath}`);
            // TODO: Figure something out here
        }

        this.rules = _.map(rawRules.rules, function(r) {
            return new RuleModel(r.name, r.targetRole, r.dependsOn, r.joinWith, r.whitelistByUserId, r.whitelistByRoleName);
        });
    }
}

module.exports = RulesData;
