const assert = require('assert');
const fs = require('fs');
const path = require('path');

const fetchPath = require.resolve('node-fetch');
require.cache[fetchPath] = {
  id: fetchPath,
  filename: fetchPath,
  loaded: true,
  exports: async () => ({ json: async () => ({ message: 'https://example.com/dog.png' }) })
};

const commands = require('../src/commands');
const messageEvent = require('../src/events/message');
const aliasesFile = path.join(__dirname, '../src/config/aliases.json');
const originalAliases = fs.readFileSync(aliasesFile, 'utf8');
process.on('exit', () => fs.writeFileSync(aliasesFile, originalAliases));

function permissionMember(id, allowed = true) {
  return { id, permissions: { has: () => allowed } };
}

function createMessage(overrides = {}) {
  const sent = [];
  const message = {
    author: { bot: false, id: 'user' },
    content: 'ping',
    channel: {
      send: async value => { sent.push(value); return value; },
      bulkDelete: async amount => ({ size: amount })
    },
    guild: {
      id: 'guild',
      name: 'Test Guild',
      memberCount: 3,
      ownerId: 'owner',
      region: 'test',
      createdAt: new Date(),
      iconURL: () => null,
      me: permissionMember('bot', true),
      members: { me: permissionMember('bot', true), cache: { get: () => permissionMember('target', true) } }
    },
    member: permissionMember('user', true),
    mentions: { users: { first: () => ({ id: 'target', displayAvatarURL: () => '' }) }, members: { last: () => null } },
    reply: async value => { sent.push(value); return value; },
    sent,
    ...overrides
  };
  return message;
}

async function run() {
  fs.writeFileSync(aliasesFile, JSON.stringify({ guild: { clear: ['تنظيف', '-b'] } }));
  const client = {
    uptime: 1000,
    user: { username: 'Bot', discriminator: '0000', id: 'bot', displayAvatarURL: () => '', createdAt: new Date() },
    guilds: { cache: { size: 1 } },
    ws: { ping: 20 }
  };

  for (const [name, command] of Object.entries(commands)) {
    assert.strictEqual(typeof command.execute, 'function', `${name} must export execute`);
    assert.deepStrictEqual(command.details.aliases, [], `${name} must have no default aliases`);
  }

  const aliasMap = new Map();
  for (const [name, command] of Object.entries(commands)) {
    aliasMap.set(name, command);
    command.details.aliases.forEach(alias => aliasMap.set(alias.toLowerCase(), command));
  }
  assert.strictEqual(aliasMap.get('banish'), undefined);
  assert.strictEqual(aliasMap.get('ping'), commands.ping);
  aliasMap.set('عربي', commands.clear);
  assert.strictEqual(aliasMap.get('عربي'), commands.clear);

  const prefixless = createMessage({ content: 'clear 3' });
  messageEvent({ config: { prefix: '!' }, commands: new Map([['clear', commands.clear]]) }, prefixless);
  await new Promise(resolve => setImmediate(resolve));
  assert.ok(prefixless.sent.some(value => value && value.embeds), 'prefix-less clear should execute');

  const arabicAlias = createMessage({ content: 'تنظيف 2' });
  messageEvent({ config: { prefix: '!' }, commands: new Map([['clear', commands.clear]]), guildAliases: new Map([['guild', { clear: ['تنظيف'] }]]) }, arabicAlias);
  await new Promise(resolve => setImmediate(resolve));
  assert.ok(arabicAlias.sent.some(value => value && value.embeds), 'Arabic aliases should execute');

  const prefixedAlias = createMessage({ content: '-B 2' });
  messageEvent({ config: { prefix: '-' }, commands: new Map([['clear', commands.clear]]), guildAliases: new Map([['guild', { clear: ['-b'] }]]) }, prefixedAlias);
  await new Promise(resolve => setImmediate(resolve));
  assert.ok(prefixedAlias.sent.some(value => value && value.embeds), 'Prefixed custom aliases should execute');

  const directAlias = createMessage({ content: 'B 2' });
  messageEvent({ config: { prefix: '-' }, commands: new Map([['clear', commands.clear]]), guildAliases: new Map([['guild', { clear: ['-b'] }]]) }, directAlias);
  await new Promise(resolve => setImmediate(resolve));
  assert.ok(directAlias.sent.some(value => value && value.embeds), 'Unprefixed custom aliases should execute');

  const standardAlias = createMessage({ content: 'b 2' });
  const standardAliasClient = { config: { prefix: '-' }, commands: new Map([['clear', commands.clear]]) };
  messageEvent(standardAliasClient, standardAlias);
  await new Promise(resolve => setImmediate(resolve));
  assert.ok(standardAlias.sent.some(value => value && value.embeds), 'Standard aliases should execute without a prefix');

  const prefixedCommand = createMessage({ content: '-clear 2' });
  messageEvent({ config: { prefix: '-' }, commands: new Map([['clear', commands.clear]]) }, prefixedCommand);
  await new Promise(resolve => setImmediate(resolve));
  assert.ok(prefixedCommand.sent.some(value => value && value.embeds), 'Prefixed commands should execute');

  const noPermission = createMessage({ content: 'clear 2', member: permissionMember('user', false) });
  messageEvent({ config: { prefix: '!' }, commands: new Map([['clear', commands.clear]]) }, noPermission);
  await new Promise(resolve => setImmediate(resolve));
  assert.ok(noPermission.sent.some(value => String(value).includes("don't have permission")), 'clear should enforce Manage Messages');

  const cases = {
    ban: createMessage(), clear: createMessage({ content: 'clear 2' }), coin: createMessage(), dog: createMessage(),
    kick: createMessage(), ping: createMessage(), roll: createMessage(), serverinfo: createMessage(),
    stats: createMessage(), userinfo: createMessage()
  };
  for (const [name, message] of Object.entries(cases)) {
    await assert.doesNotReject(() => Promise.resolve().then(() => commands[name].execute(client, message, name === 'clear' ? ['2'] : [])), `${name} should execute safely`);
  }

  let bannedId;
  const banMessage = createMessage({
    mentions: { users: { first: () => ({ id: 'target', displayAvatarURL: () => '' }) } },
  });
  banMessage.guild.members.ban = async id => { bannedId = id; };
  await commands.ban.execute(client, banMessage, []);
  assert.strictEqual(bannedId, 'target', 'ban should call GuildMemberManager.ban with target ID');

  const slashNames = Object.keys(commands);
  assert.strictEqual(new Set(slashNames).size, slashNames.length, 'slash command names must be unique');
  assert.ok(slashNames.every(name => /^[a-z0-9-]{1,32}$/.test(name)), 'slash command names must be Discord-compatible');
  console.log(`Passed command, prefix-less, alias, and slash compatibility tests for ${slashNames.length} commands`);
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});