const { EmbedBuilder } = require('discord.js');
const prefix = require('../config/config.json');

module.exports.details = {
    name: 'kick',
    author: 'Mohammed Alhajri',
    icon: 'fas fa-shoe-prints',
    aliases: [],
    description: 'Kicks a user from the server.',
    usage: `${prefix.prefix}kick {@user}`
};

module.exports.execute = async (client, message, args) => {
    const member = message && message.member;
    const mentions = message && message.mentions;
    const guild = message && message.guild;
    const channel = message && message.channel;
    const tag = member && member.id ? `<@${member.id}>` : 'User';
    if (!member || !guild || !mentions || !channel) return;

    if (guild.members && guild.members.me && guild.members.me.permissions && guild.members.me.permissions.has('KickMembers')) {
        if (member.permissions && (member.permissions.has('Administrator') || member.permissions.has('KickMembers'))) {
            const target = mentions.users.first();
            if (target) {
                const targetMember = guild.members.cache && guild.members.cache.get(target.id);
                if (!targetMember || typeof targetMember.kick !== 'function') return channel.send(`${tag} I could not find that user.`);
                try {
                    await targetMember.kick();
                    const kickEmbed = new EmbedBuilder()
                        .setColor('#eb9d17')
                        .setTitle('User Kicked')
                        .addFields(
                            { name: 'User', value: `${target} was kicked from the server!` },
                            { name: 'Moderator', value: `${member}` }
                        )
                        .setThumbnail(target.displayAvatarURL())
                        .setFooter({ text: 'Made by Mohammed Alhajri' });
                    
                    await message.channel.send({ embeds: [kickEmbed] });
                } catch (error) {
                    console.error(error);
                    message.channel.send(`${tag} I was unable to kick that user.`);
                }
            } else {
                message.channel.send(`${tag} please specify a user!`);
            }
        } else {
            message.channel.send(`${tag} you don't have permission.`);
        }
    } else {
        message.channel.send(`${tag} Sorry, I don't have permission to kick members!`);
    }
};
