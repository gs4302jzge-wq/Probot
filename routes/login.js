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

function discordCallback(req, res, next) {
    passport.authenticate('discord', (error, user, info) => {
        if (error) {
            console.error('Discord OAuth authentication failed:', error);
            req.flash('error', 'Discord authentication failed. Please try again.');
            return res.redirect('/login');
        }

        if (!user) {
            const message = info && info.message ? info.message : 'Discord authentication was not accepted.';
            console.error(`Discord OAuth rejected: ${message}`);
            req.flash('error', message);
            return res.redirect('/login');
        }

        req.logIn(user, loginError => {
            if (loginError) {
                console.error('Discord session login failed:', loginError);
                req.flash('error', 'Unable to create a login session. Please try again.');
                return res.redirect('/login');
            }

            return res.redirect('/');
        });
    })(req, res, next);
}

module.exports = router;
module.exports.discordCallback = discordCallback;
