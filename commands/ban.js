const { EmbedBuilder } = require("discord.js");
const prefix = require('../config/config.json');

module.exports.details = {
    name: 'Ban',
    author: 'Mohammed Alhajri',
    icon: 'fas fa-hammer',
    aliases: [],
    description: 'Bans a user from the server.',
    usage: `${prefix.prefix}ban {@user}`
};

module.exports.execute = async (client, message, args) => {
    const member = message && message.member;
    const mentions = message && message.mentions;
    const guild = message && message.guild;
    const channel = message && message.channel;
    const tag = member && member.id ? `<@${member.id}>` : 'User';
    if (!member || !guild || !mentions || !channel) return;

    // Проверяем, есть ли у пользователя разрешения
    if (!member.permissions || (!member.permissions.has('ADMINISTRATOR') && !member.permissions.has('BAN_MEMBERS'))) {
        return message.channel.send(`${tag} You don't have permission.`);
    }

    const target = mentions.users.first();
    if (target) {
        try {
            if (!guild.members || typeof guild.members.ban !== 'function') {
                return channel.send(`${tag} The bot cannot access the guild ban service.`);
            }
            await guild.members.ban(target.id);
            const banEmbed = new EmbedBuilder()
                .setColor('#e6350e')
                .setTitle('User banned')
                .addFields(
                    { name: 'User', value: `${target} has been banned from the server!` },
                    { name: 'Moderator', value: `${member}` }
                )
                .setFooter({ text: 'Made by Mohammed Alhajri' });

            const avatarUrl = typeof target.displayAvatarURL === 'function' ? target.displayAvatarURL() : '';
            if (avatarUrl) banEmbed.setThumbnail(avatarUrl);

            await message.channel.send({ embeds: [banEmbed] });
        } catch (error) {
            console.error('Ban command failed:', error);
            const missingPermission = error && (error.code === 50013 || error.code === '50013');
            return channel.send(missingPermission
                ? `${tag} I cannot ban that user because Discord denied the bot's permission or role hierarchy.`
                : `${tag} An error occurred while trying to ban this user.`);
        }
    } else {
        message.channel.send(`${tag} Please specify the user!`);
    }
};
