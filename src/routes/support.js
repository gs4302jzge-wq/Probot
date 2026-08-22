const express = require('express');
const router = express.Router();
const discord = require('../bot')
const { ensureAuthenticated, forwardAuthenticated } = require('../auth/auth');
const path = require('path');
const themes = path.join(__dirname, '../config/theme.json');
const jsonfile = require('jsonfile')

router.get('/support', ensureAuthenticated,(req, res) => {
    const profile = req.user || { username: 'Discord User', id: '', avatar: '' };
    try {
        const theme = jsonfile.readFileSync(themes);
        const client = discord.client || { user: { username: 'Discord Bot' } };
        res.render('home/support', {
            profile,
            client: client.user ? client : { ...client, user: { username: 'Discord Bot' } },
            theme
        });
    } catch (error) {
        console.error('Failed to load support dashboard:', error);
        res.render('home/support', {
            profile,
            client: { user: { username: 'Discord Bot' } },
            theme: { theme: 'default.css' }
        });
    }
});

module.exports = router;
