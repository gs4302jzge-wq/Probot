const config = require('../config/config.json');

module.exports = {
    ensureAuthenticated: function(req, res, next) {
      try {
        const isAuthenticated = typeof req.isAuthenticated === 'function' && req.isAuthenticated();
        if ((isAuthenticated && req.user) || req.session?.user) {
          return next();
        }
        return res.redirect('/');
      } catch (error) {
        console.error('Authentication middleware failed:', error.stack || error);
        return next(error);
      }
    },
    superAdminOnly: function(req, res, next) {
      const configuredAdmins = Array.isArray(config.Admin) ? config.Admin : [];
      const superAdminIds = String(process.env.SUPER_ADMIN_ID || process.env.BOT_OWNER_ID || '')
        .split(',')
        .concat(configuredAdmins)
        .map(id => String(id).trim())
        .filter(Boolean);
      const userId = req.user && req.user.id ? String(req.user.id) : '';

      if (userId && superAdminIds.includes(userId)) return next();
      console.error(`Settings access denied for Discord user: ${userId || 'unknown'}`);
      return res.status(403).send('Settings are restricted to the bot owner.');
    },
    forwardAuthenticated: function(req, res, next) {
      if (!req.isAuthenticated()) {
        return next();
      }
      res.redirect('/dashboard');
    }
};