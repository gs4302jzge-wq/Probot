const { resolveMessageCommand } = require('../utils/commandResolver');

module.exports = (client, message) => {
  if (!message || !message.author || message.author.bot) return;
  if (typeof message.content !== 'string') return;
  
    const resolved = resolveMessageCommand(client, message);
    const { command, commandName, args, guildId } = resolved;
    if (resolved.aliasTriggered) {
      console.log(`[Alias Triggered] Guild: ${guildId || 'DM'} | Text: ${message.content.trim()} -> Resolved Command: ${commandName}`);
    }
  
    // If that command doesn't exist, silently exit and do nothing
    if (!command) return;
    if (typeof command.execute !== 'function') return;
    Promise.resolve().then(() => command.execute(client, message, args)).catch(error => {
      console.error(`Error executing command ${commandName}:`, error);
      if (typeof message.reply === 'function') {
        Promise.resolve(message.reply('There was an error trying to execute that command!')).catch(replyError => {
          console.error(`Failed to send command error reply for ${commandName}:`, replyError);
        });
      }
    });
  };