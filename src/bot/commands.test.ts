import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { before, test } from 'node:test';
import type { Message } from 'discord.js';

const dbDir = mkdtempSync(join(tmpdir(), 'gt-bot-'));
process.env.DISCORD_TOKEN = 'test';
process.env.BOT_PREFIXES = 'give';
process.env.DB_DIR = dbDir;

let commandHandlers: typeof import('./commands.js').commandHandlers;
before(async () => {
  ({ commandHandlers } = await import('./commands.js'));
});

// Bare minimum of a discord.js Message, recording what the bot replied
function fakeMessage({ admin = false, content = '' } = {}) {
  const replies: unknown[] = [];
  const reactions: string[] = [];
  const msg = {
    content,
    guildId: 'guild-1',
    author: { id: 'user-1' },
    member: { permissions: { has: () => admin } },
    inGuild: () => true,
    reply: async (reply: unknown) => replies.push(reply),
    react: async (emoji: string) => reactions.push(emoji),
  };
  return { msg: msg as unknown as Message, replies, reactions };
}

async function run(command: string, args: string[] = [], options?: Parameters<typeof fakeMessage>[0]) {
  const fake = fakeMessage(options);
  await commandHandlers.get(command)!(fake.msg, ...args);
  return fake;
}

test('help lists every command except the hidden ones', async () => {
  const { replies } = await run('help');
  assert.deepEqual(replies, [
    'Available commads are: koreanews, ping, 500€, kang, animal, help, botinvitelink, discordlink, colocalclink, ' +
      'whitebox, bannerbox, exwhitebox, exbannerbox, supercostume, merch, defence, maths, dice, set, setup, checksetup, timetilreset',
  ]);
});

test('simple replies', async () => {
  assert.deepEqual((await run('ping')).replies, ['pong']);
  assert.deepEqual((await run('500€')).replies, ['no']);
});

test('rng calculators', async () => {
  assert.deepEqual((await run('whitebox', ['100'])).replies, ['Chance to get at least 1 white box in 100 pulls is 93.85%']);
  assert.deepEqual((await run('merch', ['10'])).replies, ['Chance to get at least 1 unique merch in 10 crafts is 26.26%']);
  assert.deepEqual((await run('bannerbox', ['abc'])).replies, ['I need a valid number of pulls!']);
});

test('defence', async () => {
  assert.deepEqual((await run('defence', ['100'])).replies, ['With 100 defence, damage is reduced by 50.00%']);
  assert.deepEqual((await run('defence', ['0'])).replies, ['I need a valid number of defence!']);
});

test('animal keeps long names under the message limit', async () => {
  const [short] = (await run('animal')).replies as string[];
  assert.equal(short.split(' ').length, 3);
  const [long] = (await run('animal', ['100000'])).replies as string[];
  assert.ok(long.length <= 1600);
});

test('poteto only reacts to "ahv"', async () => {
  assert.deepEqual((await run('poteto', [], { content: 'hello there' })).replies, []);
  const [reply] = (await run('poteto', [], { content: 'hey AHV' })).replies as string[];
  assert.match(reply, /🥔/u);
});

test('set requires admin rights and a known param, then saves it', async () => {
  assert.deepEqual((await run('set', ['newsChannelID', '123'])).replies, ['You need to have admin rights to use this command']);
  assert.deepEqual((await run('set', ['nope', '123'], { admin: true })).replies, [
    'You are trying to set unkown param! Please do give help setup, to check available commands!',
  ]);
  const { reactions } = await run('set', ['newsChannelID', ' 123 '], { admin: true });
  assert.deepEqual(reactions, ['✅']);
  assert.deepEqual(JSON.parse(readFileSync(join(dbDir, 'config.json'), 'utf8')), [{ ID: 'guild-1', newsChannelID: '123' }]);
});

test('unknown and prototype names are not commands', () => {
  assert.equal(commandHandlers.get('constructor'), undefined);
  assert.equal(commandHandlers.get('toString'), undefined);
});
