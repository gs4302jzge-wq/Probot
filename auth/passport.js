const passport = require('passport');
var DiscordStrategy = require('passport-discord').Strategy;
const config = require('../config/config.json')
const clientID = process.env.DISCORD_CLIENT_ID || process.env.CLIENT_ID || config.clientID;
const clientSecret = process.env.DISCORD_CLIENT_SECRET || config.clientSecret;
const callbackURL = 'https://probot-1-cacm.onrender.com/auth/discord/callback';
const defaultAvatarUrl = 'https://cdn.discordapp.com/embed/avatars/0.png';

module.exports = function(passport) {
    var scopes = ['identify', 'email', 'guilds', 'guilds.join'];
 
    passport.use(new DiscordStrategy({
        clientID: clientID,
        clientSecret,
        callbackURL,
        scope: scopes
    },
    function(accessToken, refreshToken, profile, cb) {
      try {
        const profileId = profile && profile.id ? String(profile.id) : '';
        const avatarHash = profile && profile.avatar ? String(profile.avatar) : '';
        const avatarUrl = profile && typeof profile.displayAvatarURL === 'function'
          ? profile.displayAvatarURL()
          : avatarHash && profileId
            ? `https://cdn.discordapp.com/avatars/${profileId}/${avatarHash}.png?size=128`
            : defaultAvatarUrl;

        return cb(null, { ...profile, avatarUrl });
      } catch (error) {
        console.error('Failed to prepare Discord profile:', error);
        return cb(null, { ...(profile || {}), avatarUrl: defaultAvatarUrl });
      }
    }));

    passport.serializeUser((user, done) => done(null, user));
    passport.deserializeUser((obj, done) => done(null, obj));
}

module.exports.callbackURL = callbackURL;
