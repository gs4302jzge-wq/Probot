const { EmbedBuilder } = require('discord.js');
const prefix = require('../config/config.json');
const moment = require("moment");
require("moment-duration-format");
const dateformat = require('dateformat');

module.exports.details = {
    name: 'Stats',
    author: 'Mohammed Alhajri',
    icon: 'fas fa-chart-bar',
    aliases: [],
    description: 'Statistics about your BOT.',
    usage: `${prefix.prefix}stats`
};

module.exports.execute = (client, message, args) => {
    const safeClient = client || {};
    const user = safeClient.user || {};
    const guildCache = safeClient.guilds && safeClient.guilds.cache;
    const duration = moment.duration(safeClient.uptime || 0).format(" D [days], H [hrs], m [mins], s [secs]");
    const infoEmbed = new EmbedBuilder()
        .setColor('#b434eb')
        .setTitle(`${user.username || 'Discord Bot'} - Stats`)
        .addFields(
            { name: "Username", value: `${user.username || 'Discord Bot'}#${user.discriminator || '0000'}` },
            { name: "Server Count", value: `${guildCache ? guildCache.size : 0}` },
            { name: "Uptime", value: duration },
            { name: "Response Time", value: `${Math.round(safeClient.ws && safeClient.ws.ping || 0)}ms` },
            { name: "Creation Date", value: dateformat(user.createdAt || new Date(), 'dddd, mmmm dS, yyyy, h:MM TT') }
        )
        .setFooter({ text: "Made by Mohammed Alhajri" });

    const avatarUrl = typeof user.displayAvatarURL === 'function' ? user.displayAvatarURL() : '';
    if (avatarUrl) infoEmbed.setThumbnail(avatarUrl);

    message.channel.send({ embeds: [infoEmbed] });
};
