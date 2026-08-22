const { EmbedBuilder } = require("discord.js");
const prefix = require('../config/config.json');
const throwdice = () => Math.floor(Math.random() * 6) + 1;

module.exports.details = {
  name: 'roll',
  description: 'Rolls a dice (6-sided).',
  author: 'Mohammed Alhajri',
  icon: 'fas fa-dice',
  aliases: [],
  usage: `${prefix.prefix}roll`
};

module.exports.execute = (client, message, args) => {
  const result = throwdice();
  
  const embed = new EmbedBuilder()
    .setColor('#b434eb')
    .setTitle('Dice Roll Result')
    .setDescription(`The Number is: \`\`${result}\`\``)
    .setFooter({ text: "Made by Mohammed Alhajri" });

  message.channel.send({ embeds: [embed] });
};
