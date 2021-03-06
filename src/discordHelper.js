const _ = require('underscore')

class DiscordHelper {
    constructor(discordClient, settings) {
        this._client = discordClient;
        this._settings = settings;
    }

    async getGuild() {
        const guild = await this._client.guilds.fetch(this._settings.guildId);
        return guild;
    }

    async getAllMembersAsync() {
        const guild = await this._client.guilds.fetch(this._settings.guildId);
        const members = await guild.members.fetch();
        return members;
    }

    async getAllMembersForRole(roleName, ignoreUserIds) {
        const userIdIgnoreList = ignoreUserIds || [];
        const normalizeRoleName = roleName.toLowerCase();
        const guild = await this.getGuild();

        // Note: We support by role name or id
        const role = guild.roles.cache.find(role => role.name.toLowerCase() === normalizeRoleName || role.id === roleName);
        var justTheMembersInRole = [];
        if (role) {
            justTheMembersInRole = role.members.filter(m => !userIdIgnoreList.includes(m.user.id)).map(m => m);
        }
        else {
            console.log(`getAllMembersForRole could not find the role ${normalizeRoleName}`);
        }

        return justTheMembersInRole;
    }

    async getRoleIdFromRoleNameAsync(roleName) {
        const normalizedRoleName = roleName.toLowerCase();
        const guild = await this._client.guilds.fetch(this._settings.guildId);
        const allRoles = await guild.roles.fetch();

        // Note: We support by role name or id
        const role = allRoles.cache.find(r => r.name.toLowerCase() === normalizedRoleName || r.id === normalizedRoleName);

        return role;
    }

    getRoleFromMemberByRoleName(member, roleName) {
        const normalizedRoleName = roleName.toLowerCase();

        // Note: We support by role name or id
        const role = member.roles.cache.find(role => role.name.toLowerCase() === normalizedRoleName || r.id === normalizedRoleName);
        return role;
    }
}

module.exports = DiscordHelper;
