const { EmbedBuilder } = require("discord.js");
const config = require('../config/config.json');

module.exports.details = {
  name: 'ping',
  description: 'Ping / Pong!',
  author: 'Mohammed Alhajri',
  icon: 'fas fa-signal',
  aliases: [],
  usage: `${config.prefix}ping`
};

module.exports.execute = (client, message, args) => {
  if (message && message.channel && typeof message.channel.send === 'function') {
    message.channel.send('Pong!');
  } else {
    console.error('Message object is invalid or channel.send is not a function.');
  }
};
