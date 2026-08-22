const { EmbedBuilder } = require("discord.js");
const prefix = require('../config/config.json');

module.exports.details = {
    name: 'coin',
    author: 'Mohammed Alhajri',
    icon: 'fas fa-coins',
    aliases: [],
    description: 'Simple coin flip command',
    usage: `${prefix.prefix}coin`
};

module.exports.execute = async (client, message, args) => {
    const flip = () => {
        const rand = ['Heads!', 'Tails!'];
        return rand[Math.floor(Math.random() * rand.length)];
    };

    const resultEmbed = new EmbedBuilder()
        .setColor('#b434eb')
        .setTitle('Coin Flip Result')
        .setDescription(`The result is: \`\`${flip()}\`\``)
        .setFooter({ text: "Made by Mohammed Alhajri" });

    await message.channel.send({ embeds: [resultEmbed] });
};
