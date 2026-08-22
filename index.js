const express = require('express')
const discord = require('./bot')
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const fileUpload = require('express-fileupload');
const config = require('./config/config.json')
const path = require('path');

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const port = process.env.PORT || 1337;
const publicPath = path.join(__dirname, 'public');
const themesPath = path.join(__dirname, 'themes');
const viewsPath = path.join(__dirname, 'views');

app.use(express.static(publicPath));
app.use(express.static(themesPath));
app.set('view engine', 'ejs');
app.set('views', viewsPath);
app.use(express.urlencoded({ extended: true,limit: '5mb' }));
app.use(fileUpload());

require('./auth/passport')(passport);


// Express session
app.set('trust proxy', 1);
app.use(
    session({
      secret: process.env.SESSION_SECRET || 'supersecretkey',
      proxy: true,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: true,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
      }
    })
);
  
// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global variables
app.use(function(req, res, next) {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

app.use('/', require('./routes/home.js'));
app.use('/', require('./routes/settings.js'));
app.use('/', require('./routes/guilds.js'));
app.use('/', require('./routes/support.js'));
app.use('/', require('./routes/plugins.js'));

const loginRoutes = require('./routes/login.js');
app.use('/', loginRoutes);
app.get('/auth/discord/callback',
  passport.authenticate('discord', { failureRedirect: '/' }),
  (req, res) => {
    try {
      req.session.user = req.user;
      req.session.save(error => {
        if (error) {
          console.error('Session Save Error:', error.stack || error);
          return res.redirect('/');
        }
        res.redirect('/dashboard');
      });
    } catch (error) {
      console.error('OAuth callback handler failed:', error.stack || error);
      res.redirect('/');
    }
  }
);

http.listen(port)

io.sockets.on('connection', function(sockets){
  setInterval(function(){ 
    // Uptime Count
    let days = Math.floor(discord.client.uptime / 86400000);
    let hours = Math.floor(discord.client.uptime / 3600000) % 24;
    let minutes = Math.floor(discord.client.uptime / 60000) % 60;
    let seconds = Math.floor(discord.client.uptime / 1000) % 60;
  
    var BOTuptime = `${days}d ${hours}h ${minutes}m ${seconds}s` 
    
    // Emit count to browser 
    sockets.emit('uptime',{uptime:BOTuptime}); }, 1000);
})

// Error Pages
app.use(function(req,res){
  res.status(404).render('error_pages/404');
});

app.use(function(error, req, res, next) {
  console.error('Unhandled server error:', error && error.stack ? error.stack : error);
  if (res.headersSent) return next(error);
  res.status(500).send('Internal Server Error');
});
