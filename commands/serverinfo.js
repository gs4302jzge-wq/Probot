const { EmbedBuilder } = require("discord.js");
const prefix = require('../config/config.json');
const dateformat = require('dateformat');
const number = require('easy-number-formatter');

module.exports.details = {
  name: 'serverinfo',
  description: 'Sends information about the current server!',
  author: 'Mohammed Alhajri',
  icon: 'fas fa-server',
  aliases: [],
  usage: `${prefix.prefix}serverinfo`
};

module.exports.execute = (client, message, args) => {
  const guild = message && message.guild;
  if (!guild || !guild.members || !guild.id) return message.channel.send('This command can only be used in a server.');
  const infoEmbed = new EmbedBuilder()
    .setColor('#b434eb')
    .setTitle(`Server Info - ${guild.name || 'Unknown Server'}`)
    .addFields(
      { name: "Server Name", value: `${guild.name || 'Unknown Server'}`, inline: true },
      { name: "Server Owner", value: `${guild.members.cache && guild.members.cache.get(guild.ownerId) || 'Unknown'}`, inline: true },
      { name: "ID", value: `${guild.id}` },
      { name: "Server Region", value: `${guild.region || 'Unknown'}` },
      { name: "Member Count", value: `${number.formatNumber(guild.memberCount || 0)}` },
      { name: "Creation Date", value: dateformat(`${guild.createdAt || new Date()}`, 'dddd, mmmm dS, yyyy') }
    )
    .setFooter({ text: "Made by Mohammed Alhajri" });

  const iconUrl = typeof guild.iconURL === 'function' ? guild.iconURL() : '';
  if (iconUrl) infoEmbed.setThumbnail(iconUrl);

  message.channel.send({ embeds: [infoEmbed] });
};
