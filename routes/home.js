const express = require('express');
const router = express.Router();
const discord = require('../bot')
const { ensureAuthenticated, forwardAuthenticated } = require('../auth/auth');
const dateformat = require('dateformat');
const config = require('../config/config.json')
const ver = require('../config/version.json')

const number = require('easy-number-formatter')
var request = require("request");
const jsonfile = require('jsonfile')
const path = require('path');

const themes = path.join(__dirname, '../config/theme.json')

function getSafeClient() {
  const botClient = discord.client || {};
  const botUser = botClient.user || {};
  const guildCache = botClient.guilds && botClient.guilds.cache;

  return {
    ...botClient,
    user: {
      username: botUser.username || 'Discord Bot',
      avatarURL: botUser.avatarURL ? botUser.avatarURL() : '',
      discriminator: botUser.discriminator || '0000',
      id: botUser.id || 'Unavailable'
    },
    guilds: {
      cache: guildCache || {
        size: 0,
        reduce: () => 0
      }
    },
    ws: {
      ...(botClient.ws || {}),
      ping: Number.isFinite(botClient.ws && botClient.ws.ping) ? botClient.ws.ping : 0
    }
  };
}

router.get('/', (req,res) =>{
  try {
    const botUser = discord.client && discord.client.user;
    return res.render('login/login', {
      user: botUser ? botUser.username : 'Discord BOT Dashboard',
      avatar: botUser && typeof botUser.avatarURL === 'function' ? botUser.avatarURL() : ''
    });
  } catch (error) {
    console.error('Failed to render login page:', error.stack || error);
    return res.status(500).send('Unable to load the login page.');
  }
})

router.get(['/home', '/dashboard'], ensureAuthenticated,(req, res) => {
  let theme;
  let safeClient;
  let safeProfile;

  try {
    theme = jsonfile.readFileSync(themes);
    safeClient = getSafeClient();
    safeProfile = req.user || { username: 'Discord User', id: '', avatar: '' };
  } catch (error) {
    console.error('Failed to prepare dashboard data:', error);
    theme = { theme: 'default.css' };
    safeClient = getSafeClient();
    safeProfile = req.user || { username: 'Discord User', id: '', avatar: '' };
  }

  const joinedDate = discord.client && discord.client.user && discord.client.user.createdAt
    ? dateformat(`${discord.client.user.createdAt}`, 'dddd, mmmm dS, yyyy, h:MM TT')
    : 'Unavailable';
    var options = {
        method: 'GET',
        url: `https://raw.githubusercontent.com/gs4302jzge-wq/Probot/main/config/version.json`,
        headers: {
          'User-Agent': 'Discord-Bot-Dashboard',
          useQueryString: true
        }
      }
      // Prase update request data to JSON.
      request(options, function (error, response, body) {
        try 
        {
          jsonprased = JSON.parse(body)
          verL = jsonprased.ver
        } 
        catch (e) 
        {
          console.error('Failed to check for updates; continuing with the current version.');
          verL = ver.ver
        }
      try {
        res.render('home/home',{
          profile: safeProfile,
          client: safeClient,
          joinedDate: joinedDate,
          prefix: config.prefix,
          number: number,
          Latestversion: verL,
          Currentversion: ver.ver,
          theme: theme
        });
      } catch (renderError) {
        console.error('Failed to render dashboard home:', renderError);
        res.status(500).send('Unable to load the dashboard.');
      }
    })
})

// Logout
router.get('/logout', (req, res, next) => {
    req.logout(function(err) {
      if (err) {
        console.error('Logout failed:', err);
        return next(err);
      }

      if (!req.session) {
        res.clearCookie('connect.sid', { path: '/' });
        return res.redirect('/login');
      }

      req.session.destroy(function(sessionError) {
        if (sessionError) {
          console.error('Session destruction failed during logout:', sessionError);
          return next(sessionError);
        }

        res.clearCookie('connect.sid', { path: '/' });
        return res.redirect('/login');
      });
    });
  });
  
module.exports = router;
