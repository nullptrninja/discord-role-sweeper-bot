class RuleModel {
    constructor(name, roleNameToAffect, dependentRoleNames, joinOperator, whitelistUserIds, whitelistByRoleName) {
        this.name = name;
        this.targetRole = roleNameToAffect;
        this.dependsOn = dependentRoleNames;       // Array
        this.joinWith = joinOperator;
        this.whitelistByUserId = whitelistUserIds;   // Array of strings
        this.whitelistByRoleName = whitelistByRoleName.map(r => r.toLowerCase()); // Array of strings
    }
}

module.exports = RuleModel;
