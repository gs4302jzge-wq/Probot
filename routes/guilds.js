const express = require('express');
const router = express.Router();
const { ensureAuthenticated, forwardAuthenticated } = require('../auth/auth');
const discord = require('../bot');
const dateformat = require('dateformat');
const number = require('easy-number-formatter');
const path = require('path');
const themes = path.join(__dirname, '../config/theme.json');
const jsonfile = require('jsonfile');
const config = require('../config/config.json');

const ADMINISTRATOR = 0x8;
const MANAGE_GUILD = 0x20;

function hasGuildManagementPermission(permissionValue) {
    const permissions = Number(permissionValue || 0);
    return (permissions & ADMINISTRATOR) === ADMINISTRATOR || (permissions & MANAGE_GUILD) === MANAGE_GUILD;
}

function getManagedGuilds(profile) {
    const userGuilds = Array.isArray(profile && profile.guilds) ? profile.guilds : [];
    const botGuilds = discord.client && discord.client.guilds && discord.client.guilds.cache;
    const clientId = process.env.DISCORD_CLIENT_ID || process.env.CLIENT_ID || config.clientID;
    const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(clientId)}&scope=bot%20applications.commands&permissions=0`;

    return userGuilds
        .filter(guild => guild && guild.id && hasGuildManagementPermission(guild.permissions))
        .map(guild => {
            const botGuild = botGuilds && typeof botGuilds.get === 'function' ? botGuilds.get(guild.id) : null;
            return {
                id: String(guild.id),
                name: guild.name || 'Unnamed Server',
                iconUrl: guild.icon
                    ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=128`
                    : 'https://cdn.discordapp.com/embed/avatars/0.png',
                memberCount: botGuild ? botGuild.memberCount || 0 : 0,
                region: 'Unavailable',
                createdAt: botGuild && botGuild.createdAt ? botGuild.createdAt : new Date(),
                joinedAt: botGuild && botGuild.joinedAt ? botGuild.joinedAt : new Date(),
                botPresent: Boolean(botGuild),
                inviteUrl
            };
        });
}

router.get('/guilds', ensureAuthenticated, (req, res) => {
    try {
        const theme = jsonfile.readFileSync(themes);
        const client = discord.client || {};
        const guilds = getManagedGuilds(req.user);
        const safeClient = {
            ...client,
            user: client.user || { username: 'Discord Bot' }
        };

        res.render('home/guilds', {
            guilds: guilds,
            profile: req.user || { username: 'Discord User', id: '', avatar: '' },
            client: safeClient,
            dateformat: dateformat,
            number: number,
            theme: theme
        });
    } catch (error) {
        console.error('Failed to load guilds dashboard:', error);
        res.render('home/guilds', {
            guilds: [],
            profile: req.user || { username: 'Discord User', id: '', avatar: '' },
            client: { user: { username: 'Discord Bot' } },
            dateformat: dateformat,
            number: number,
            theme: { theme: 'default.css' }
        });
    }
});

router.post('/guilds/leave/:id', ensureAuthenticated, (req, res) => {
    const allowedGuild = getManagedGuilds(req.user).find(guild => guild.id === String(req.params.id));
    const botGuild = discord.client && discord.client.guilds && discord.client.guilds.cache
        ? discord.client.guilds.cache.get(String(req.params.id))
        : null;
    if (!allowedGuild || !botGuild || typeof botGuild.leave !== 'function') {
        req.flash('error', 'You can only manage servers you administer where the bot is present.');
        return res.redirect('/guilds');
    }

    botGuild.leave().then(value => {
        req.flash('success', `Successfully left guild "${value.name}"`);
        res.redirect('/guilds');
    }).catch(error => {
        console.error('Failed to leave guild:', error);
        req.flash('error', 'Unable to leave that server.');
        res.redirect('/guilds');
    });
});

module.exports = router;
