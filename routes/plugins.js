const express = require('express');
const router = express.Router();
const discord = require('../bot')
const { ensureAuthenticated, forwardAuthenticated } = require('../auth/auth');
var commands = require("../commands");
const fs = require("fs");
const fileUpload = require('express-fileupload');
const jsonfile = require('jsonfile')
const path = require('path');
json = require('json-update');
const themes = path.join(__dirname, '../config/theme.json');
const settingsFile = path.join(__dirname, '../config/settings.json');
const commandsPath = path.join(__dirname, '../commands');
const { readAliasStore, writeAliasStore } = require('../utils/commandResolver');
const ADMINISTRATOR = 0x8;
const MANAGE_GUILD = 0x20;

function managedGuilds(profile) {
  return (Array.isArray(profile && profile.guilds) ? profile.guilds : [])
    .filter(guild => guild && guild.id && ((Number(guild.permissions || 0) & ADMINISTRATOR) || (Number(guild.permissions || 0) & MANAGE_GUILD)))
    .map(guild => ({ id: String(guild.id), name: guild.name || 'Unnamed Server' }));
}

router.get('/plugins', ensureAuthenticated,(req, res) => {
  const profile = req.user || { username: 'Discord User', id: '', avatar: '' };
  const client = discord.client || { user: { username: 'Discord Bot' } };
  try {
    const theme = jsonfile.readFileSync(themes);
    const commandsToggle = jsonfile.readFileSync(settingsFile);
    const files = fs.readdirSync(commandsPath);
    const availableGuilds = managedGuilds(req.user);
    const requestedGuildId = String(req.query.guildId || '');
    const selectedGuildId = availableGuilds.some(guild => guild.id === requestedGuildId)
      ? requestedGuildId
      : String(availableGuilds[0]?.id || '');
    const aliasesConfig = readAliasStore();
    const selectedAliases = aliasesConfig[selectedGuildId] || {};
    const guildCommands = Object.fromEntries(Object.entries(commands).map(([name, command]) => [name, {
      ...command,
      details: { ...command.details, aliases: [...new Set(selectedAliases[name] || [])] }
    }]));
    res.render('home/plugins',{
        profile,
        client: client.user ? client : { ...client, user: { username: 'Discord Bot' } },
        commands:guildCommands,
        commandName:files,
        commandsToggle:commandsToggle,
        theme:theme,
        managedGuilds: availableGuilds,
        selectedGuildId
    });
  } catch (error) {
    console.error('Failed to load plugins dashboard:', error);
    let fallbackCommandNames = [];
    try {
      fallbackCommandNames = fs.readdirSync(commandsPath);
    } catch (commandError) {
      console.error('Failed to load plugin command files:', commandError);
    }
    res.render('home/plugins', {
      profile,
      client: { user: { username: 'Discord Bot' } },
      commands: commands || {},
      commandName: fallbackCommandNames,
      commandsToggle: [],
      theme: { theme: 'default.css' },
      managedGuilds: managedGuilds(req.user),
      selectedGuildId: ''
    });
  }
});

router.post('/plugins/remove/:plugin', ensureAuthenticated,function(req,res) {
  try {
    fs.unlinkSync('./commands/'+req.params.plugin)
    req.flash('success', `Plugin ${req.params.plugin} was successfully removed!` )
    res.redirect('/plugins')
  } catch(err) {
    console.error(err)
  }
})

router.post('/plugins/aliases', ensureAuthenticated, (req, res) => {
  try {
    const commandName = String(req.body.commandName || '').trim().toLowerCase();
    const submittedAliases = Array.isArray(req.body.aliases)
      ? req.body.aliases
      : [req.body.aliases || ''];
    const aliases = [...new Set(submittedAliases
      .map(alias => String(alias).trim().toLowerCase())
      .filter(Boolean))]
      .filter(alias => alias !== commandName)
      .slice(0, 5);
    const guildId = String(req.body.guildId || '').trim();
    const command = commands[commandName];
    if (!command) return res.status(404).send('Plugin not found');
    if (!managedGuilds(req.user).some(guild => guild.id === guildId)) return res.status(403).send('You cannot manage aliases for this server');

    const savedAliases = readAliasStore();
    savedAliases[guildId] = savedAliases[guildId] || {};
    savedAliases[guildId][commandName] = aliases;
    writeAliasStore(savedAliases);
    discord.client.guildAliases.set(guildId, savedAliases[guildId]);
    res.redirect(`/plugins?guildId=${encodeURIComponent(guildId)}`);
  } catch (error) {
    console.error('Failed to update plugin aliases:', error);
    req.flash('error', 'Unable to update plugin aliases.');
    res.redirect('/plugins');
  }
});

router.post('/plugins/toggle', ensureAuthenticated,function(req, res) {
  // Remove plugin from settings file
  if(req.body.toggle == "true"){
    fs.readFile('./config/settings.json', function (err, data) {
      var json = JSON.parse(data);
      if(!json.includes(req.body.commandName)){
        return req.flash('error', `Error`), 
        res.redirect('/plugins')
      }
      json.splice(json.indexOf(`${req.body.commandName}`),1);    
      fs.writeFile("./config/settings.json", JSON.stringify(json), function(err){
        if (err) throw err;
        res.redirect('/plugins')
      });
  })
  }

  // Add plugin to settings file
  if(req.body.toggle == "false"){
    fs.readFile('./config/settings.json', function (err, data) {
      var json = JSON.parse(data);
      if(json.includes(req.body.commandName)){
        return req.flash('error', `Error`), 
        res.redirect('/plugins')
      }
      json.push(`${req.body.commandName}`);    
      fs.writeFile("./config/settings.json", JSON.stringify(json), function(err){
        if (err) throw err;
        res.redirect('/plugins')
      });
  })
  }
});

router.post('/plugins/upload', ensureAuthenticated,function(req, res) {
    let sampleFile;
    let uploadPath;
  
    if (!req.files || Object.keys(req.files).length === 0) {
      return req.flash('error', `No file was uploaded, please try again!`), 
      res.redirect('/plugins')
    }
    if(!req.files.sampleFile.name.endsWith(".js")){
      return req.flash('error', `Please only upload Javascript files!`), 
      res.redirect('/plugins')
    }
    const path = './commands/' + req.files.sampleFile.name
    if(fs.existsSync(path)) {
      return req.flash('error', `Plugin with that name already exists!`), 
      res.redirect('/plugins')
    }

    sampleFile = req.files.sampleFile;
    uploadPath = './commands/' + sampleFile.name;
  
    sampleFile.mv(uploadPath, function(err) {
      if (err)
        return res.status(500).send(err);
  
        req.flash('success', `Plugin ${sampleFile.name} successfully uploaded, please now restart Discord BOT Dashboard for changes to take effect!`)
        res.redirect('/plugins')
    });
  });

module.exports = router;
