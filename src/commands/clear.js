const { EmbedBuilder } = require("discord.js");
const prefix = require('../config/config.json');

module.exports.details = {
    name: 'clear',
    author: 'Mohammed Alhajri',
    icon: 'fas fa-broom',
    aliases: [],
    description: 'Clears messages from a channel.',
    usage: `${prefix.prefix}clear {amount}`
};

module.exports.execute = async (client, message, args) => {
    const member = message && message.member;
    const guild = message && message.guild;
    const channel = message && message.channel;
    const tag = member && member.id ? `<@${member.id}>` : 'User';
    const reply = content => channel && typeof channel.send === 'function' ? channel.send(content) : Promise.resolve();

    const channelType = channel && channel.type;
    const isGuildTextChannel = channelType === undefined || channelType === 0 || channelType === 'GUILD_TEXT' || channelType === 'GuildText';
    if (!guild || !guild.members || !member || !channel || !isGuildTextChannel || typeof channel.bulkDelete !== 'function') {
        return reply('This command can only be used in a server channel.');
    }

    const botMember = guild.members.me;
    const botCanManage = botMember && botMember.permissions && (botMember.permissions.has('ManageMessages') || botMember.permissions.has('MANAGE_MESSAGES'));
    const userCanManage = member.permissions && member.permissions.has('ManageMessages');
    if (botCanManage) {
        if (userCanManage) {
            let deleteAmount;

            if (isNaN(args[0]) || parseInt(args[0]) <= 0) {
                return reply('Please indicate the number!');
            }

            if (parseInt(args[0]) > 100) {
                return reply('You can only delete 100 messages at a time!');
            } else {
                deleteAmount = parseInt(args[0]);
                const deletedMessages = await message.channel.bulkDelete(deleteAmount, true);
                const successEmbed = new EmbedBuilder()
                    .setColor('#b434eb')
                    .setTitle('Messages have been deleted')
                    .setDescription(`**Successfully removed** ${deletedMessages.size} messages.`)
                    .setFooter({ text: "Made by Mohammed Alhajri" });

                await message.channel.send({ embeds: [successEmbed] });
            }
        } else {
                reply(`${tag} you don't have permission.`);
        }
    } else {
        reply(`${tag} Sorry, I don't have permission to manage messages!`);
    }
};
