const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../config/aliases.json');
const dataPath = path.join(__dirname, '../data/aliases.json');
const aliasPaths = [dataPath, configPath];

function readAliasStore() {
    for (const aliasPath of aliasPaths) {
        try {
            if (fs.existsSync(aliasPath)) {
                return JSON.parse(fs.readFileSync(aliasPath, 'utf8'));
            }
        } catch (error) {
            console.error(`Error reading aliases from ${aliasPath}:`, error);
        }
    }
    return {};
}

function writeAliasStore(aliases) {
    const aliasPath = aliasPaths.find(candidate => fs.existsSync(candidate)) || configPath;
    fs.writeFileSync(aliasPath, JSON.stringify(aliases, null, 2));
}

function getAliases(guildId) {
    const aliases = readAliasStore();
    if (!aliases || Array.isArray(aliases) || typeof aliases !== 'object') return {};
    return aliases[guildId] || aliases;
}

function resolveMessageCommand(client, message) {
    if (!message || !message.guild || !message.content || message.author.bot) return null;

    const guildAliases = getAliases(message.guild.id);
    const args = message.content.trim().split(/ +/);
    const input = args.shift().toLowerCase();

    // البحث عن الأمر المطابق للاختصار
    let targetCommand = null;
    for (const [commandName, aliasList] of Object.entries(guildAliases)) {
        if (Array.isArray(aliasList) && aliasList.some(alias => String(alias).toLowerCase() === input)) {
            targetCommand = commandName;
            break;
        } else if (typeof aliasList === 'string' && aliasList.toLowerCase() === input) {
            targetCommand = commandName;
            break;
        }
    }

    if (!targetCommand) return null;

    const command = client.commands.get(targetCommand);
    if (!command) return null;

    return {
        command,
        commandName: targetCommand,
        args,
        guildId: message.guild.id,
        aliasTriggered: true
    };
}

module.exports = { resolveMessageCommand, readAliasStore, writeAliasStore };
