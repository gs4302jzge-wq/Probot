const { EmbedBuilder } = require("discord.js");
const prefix = require('../config/config.json');
const fetch = require("node-fetch");

module.exports.details = {
    name: 'dog',
    author: 'Mohammed Alhajri',
    icon: 'fas fa-dog',
    aliases: [],
    description: 'Sends a random image of a dog.',
    usage: `${prefix.prefix}dog`
};

module.exports.execute = async (client, message, args) => {
    const uri = "https://dog.ceo/api/breeds/image/random";
    try {
        const response = await fetch(uri);
        const json = await response.json();

        const dogEmbed = new EmbedBuilder()
            .setColor('#b434eb')
            .setTitle('Dog')
            .setImage(json.message)
            .setFooter({ text: "Made by Mohammed Alhajri" });

        await message.channel.send({ embeds: [dogEmbed] });
    } catch (error) {
        console.error(error);
        message.channel.send('Sorry, I could not fetch a dog image at this time.');
    }
};
