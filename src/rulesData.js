const fs = require("fs");
const RuleModel = require("./ruleModel");

class RulesData {
    constructor(rulesFilePath) {
        this._savePath = rulesFilePath;
        this._loadRules(rulesFilePath);
    }

    addRule(ruleModel) {
        if (!ruleModel) {
            console.log("Cannot add undefined rule model");
            return;
        }

        this.rules.push(ruleModel);
    }

    removeRule(ruleName) {
        if (!this.rules || this.rules.length === 0) {
            return false;
        }

        this.rules = this.rules.filter(r => r.name !== ruleName);
        return true;
    }

    saveFile() {
        const obj = { rules: this.rules };
        const asJson = JSON.stringify(obj, null, 4)
        fs.writeFileSync(this._savePath, asJson);
        console.log(`Saved rules files to: ${this._savePath}`);
    }

    containsRule(name) {
        if (!this.rules || this.rules.length === 0) {
            return false;
        }

        return this.rules.filter(r => r.name === name).length > 0;
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
        if (rawRules === undefined) {
            console.log(`Could not load rules data: ${rulesFilePath}`);
            throw `Could not load rules file: ${rulesFilePath} - unable to continue.`
        }

        this.rules = rawRules.rules.map(r => {
            return new RuleModel(r.name, r.targetRole, r.dependsOn, r.joinWith, r.whitelistByUserId, r.whitelistByRoleName);
        });
    }
}

module.exports = RulesData;
