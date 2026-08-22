const express = require('express');
const router = express.Router();
const discord = require('../bot')
const { ensureAuthenticated, forwardAuthenticated } = require('../auth/auth');
const passport = require('passport');
const { callbackURL } = require('../auth/passport');

router.get('/login', forwardAuthenticated, (req, res) => {
    const botUser = discord.client.user;
    res.render('login/login',{
        user:botUser ? botUser.username : 'Discord BOT Dashboard',
        avatar:botUser ? botUser.avatarURL() : ''
    })
})

router.get('/login/api', forwardAuthenticated, (req, res, next) => {
    console.log('Generated Redirect URI:', callbackURL);
    passport.authenticate('discord')(req, res, next);
});

module.exports = router;
