const { EmbedBuilder } = require('discord.js');
const dateformat = require('dateformat');
const prefix = require('../config/config.json');

module.exports.details = {
    name: 'userinfo',
    author: 'Mohammed Alhajri',
    icon: 'fas fa-user',
    aliases: [],
    description: 'Sends information about a given user.',
    usage: `${prefix.prefix}userinfo {@user}`
};

module.exports.execute = (client, message, args) => {
    const guild = message && message.guild;
    const mentions = message && message.mentions;
    const member = (mentions && mentions.members && mentions.members.last && mentions.members.last())
        || (guild && guild.members && guild.members.cache && guild.members.cache.get(args[0]))
        || (message && message.member);
    if (!member || !member.user) return message.channel.send('Please specify a valid user.');

    const infoEmbed = new EmbedBuilder()
        .setColor('#b434eb')
        .setTitle(`User Info - ${member.user.username}`)
        .addFields(
            { name: "Username", value: `${member.user.username}#${member.user.discriminator}`, inline: true },
            { name: "ID", value: `${member.user.id}`, inline: true },
            { name: "Account Creation", value: dateformat(member.user.createdAt, 'dddd, mmmm dS, yyyy') },
            { name: "Joined Server", value: dateformat(member.joinedAt, 'dddd, mmmm dS, yyyy') },
            { name: 'Roles', value: member.roles.cache.map(r => `${r}`).join(' | ') || 'None', inline: true }
        )
        .setFooter({ text: 'Made by Mohammed Alhajri' });

    const avatarUrl = typeof member.user.displayAvatarURL === 'function' ? member.user.displayAvatarURL() : '';
    if (avatarUrl) infoEmbed.setThumbnail(avatarUrl);

    message.channel.send({ embeds: [infoEmbed] });
};
