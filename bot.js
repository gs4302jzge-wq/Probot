const Discord = require("discord.js");
const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const fs = require("fs");
const chalk = require('chalk');
const commands = require('./commands/index');

const { GatewayIntentBits } = require('discord.js');

const client = new Discord.Client({
  intents: [
    GatewayIntentBits.Guilds, // Access to guilds (servers)
    GatewayIntentBits.GuildMembers, // Access to guild members
    GatewayIntentBits.GuildBans, // Access to user bans
    GatewayIntentBits.GuildEmojisAndStickers, // Access to emojis and stickers
    GatewayIntentBits.GuildIntegrations, // Access to integrations
    GatewayIntentBits.GuildWebhooks, // Access to webhooks
    GatewayIntentBits.GuildInvites, // Access to invitations
    GatewayIntentBits.GuildVoiceStates, // Access to voice channels and user states
    GatewayIntentBits.GuildPresences, // Access to presence statuses (online/offline)
    GatewayIntentBits.GuildMessages, // Access to guild messages
    GatewayIntentBits.GuildMessageReactions, // Access to guild message reactions
    GatewayIntentBits.GuildMessageTyping, // Access to typing indicators
    GatewayIntentBits.DirectMessages, // Access to direct messages (Direct Messages)
    GatewayIntentBits.DirectMessageReactions, // Access to direct message reactions
    GatewayIntentBits.DirectMessageTyping, // Access to typing indicators in direct messages
    GatewayIntentBits.MessageContent, // Access to message content
    GatewayIntentBits.GuildScheduledEvents, // Access to scheduled guild events
    GatewayIntentBits.AutoModerationConfiguration, // Access to automatic moderation configuration
    GatewayIntentBits.AutoModerationExecution // Access to automatic moderation rules execution moderation
  ]
});

const config = require('./config/config.json');
const settings = require('./config/settings.json');
const eventsPath = __dirname + '/events';
const clientID = process.env.DISCORD_CLIENT_ID || process.env.CLIENT_ID || config.clientID;
client.commands = new Map();
client.guildAliases = new Map();
client.config = { ...config, clientID };

// Loading events
fs.readdir(eventsPath, (err, files) => {
  if (err) return console.error(err);
  files.forEach(file => {
    const event = require(`./events/${file}`);
    let eventName = file.split(".")[0];
    client.on(eventName, event.bind(null, client));
  });
});

// Loading commands
Object.keys(commands).forEach(commandName => {
  let props = commands[commandName];
  if (settings.includes(commandName)) return;
  console.log(chalk.green(`[+] Loaded command: ${commandName}`));
  console.log(`Loading command from ${__filename}`);


  try {
      client.commands.set(commandName, props);
  } catch (error) {
      console.error(`Error loading command ${commandName}: ${error}`);
  }
});

// Когда бот готов
client.on("ready", () => {
  client.user.setActivity('Set Activity', { type: 'WATCHING' });
  registerSlashCommands().catch(error => console.error('Slash command registration failed:', error));
});

async function registerSlashCommands() {
  const slashCommands = Object.entries(commands)
    .filter(([commandName]) => !settings.includes(commandName))
    .map(([commandName, command]) => {
      const builder = new SlashCommandBuilder()
        .setName(commandName)
        .setDescription(command.details?.description || `Run the ${commandName} command`);

      if (['ban', 'kick', 'userinfo'].includes(commandName)) {
        builder.addUserOption(option => option.setName('user').setDescription('User to target').setRequired(false));
      }
      if (commandName === 'clear') {
        builder.addIntegerOption(option => option.setName('amount').setDescription('Number of messages').setRequired(true));
      }
      return builder.toJSON();
    });

  const token = process.env.DISCORD_TOKEN || config.token;
  if (!token || !client.user) return;
  const rest = new REST({ version: '10' }).setToken(token);
  await rest.put(Routes.applicationCommands(client.user.id), { body: slashCommands });
  console.log(`Registered ${slashCommands.length} main slash commands`);
}

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const command = commands[interaction.commandName];
  if (!command || typeof command.execute !== 'function') return;

  const user = interaction.options.getUser('user');
  const interactionChannel = interaction.channel;
  const message = {
    author: interaction.user,
    channel: {
      type: interactionChannel && interactionChannel.type,
      send: payload => interaction.reply(payload),
      bulkDelete: (amount, filterOld) => interactionChannel.bulkDelete(amount, filterOld)
    },
    guild: interaction.guild,
    member: interaction.member,
    mentions: {
      users: {
        first: () => interaction.options.getUser('user')
      },
      members: {
        last: () => interaction.options.getMember('user') || interaction.guild?.members?.cache?.get(user?.id)
      }
    },
    reply: payload => interaction.reply(payload)
  };
  const amount = interaction.options.getInteger('amount');
  const args = [];
  if (amount !== null) args.push(String(amount));
  if (user) args.push(user.id);

  try {
    await command.execute(client, message, args);
  } catch (error) {
    console.error(`Error executing slash command ${interaction.commandName}:`, error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply('There was an error trying to execute that command!');
    }
  }
});

client.login(process.env.DISCORD_TOKEN || config.token).catch(error => {
  console.error(`Discord login failed: ${error.message}`);
});

exports.client = client;
