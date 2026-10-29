import { PermissionFlagsBits, type Message, type MessageCreateOptions } from 'discord.js';
import { generateID } from 'animal-ids';
import { getLogger } from '../logger.js';
import { configHelp, guildConfig, isGuildSetting } from '../guild-config.js';
import { checkCafeNews } from '../news/cafe-checker.js';
import { atLeastOneChance, defenceReduction, objToEmbedFields, randomNumber, timeUntilReset } from '../helpers.js';
import { genMaths } from './maths.js';

const logger = getLogger('Commands');

// Every prefix command gets the message and the rest of the words in it as arguments
export type CommandHandler = (msg: Message, ...args: string[]) => unknown;

const maxMessageLength = 2000;
const setupHelpFields = objToEmbedFields(configHelp);

const kangImages: Array<[rngBelow: number, url: string]> = [
  [50, 'https://cdn.discordapp.com/attachments/859857183625576450/929899362639835176/free_kang.png'],
  [60, 'https://cdn.discordapp.com/attachments/859857183625576450/930145483605803078/free_kang_lp.png'],
  [65, 'https://cdn.discordapp.com/attachments/930468197893808139/932037958373109840/free_kang_lapice.png'],
  [70, 'https://cdn.discordapp.com/attachments/859857183625576450/930148374571798588/free_kang_egg.png'],
  [75, 'https://cdn.discordapp.com/attachments/930468197893808139/930559007305924648/free_kanna.png'],
  [80, 'https://cdn.discordapp.com/attachments/859857183625576450/930150768680517662/free_rick_roll.png'],
  [85, 'https://cdn.discordapp.com/attachments/860540258570731572/930469675039596595/kang_drip.png'],
  [95, 'https://cdn.discordapp.com/attachments/859857183625576450/930141593850220635/no_more_free_kang.png'],
  [Infinity, 'https://cdn.discordapp.com/attachments/860540258570731572/930462437512208464/golden_kang.png'],
];

const potetoUserID = '231048989980622849';
let potetoAmount = 0;

// Animal names are cut down to fit into a message anyway, no need to generate more words than that
const maxAnimalWords = 500;
const maxAnimalLength = 1500;

const isAdmin = (msg: Message) => msg.member?.permissions.has(PermissionFlagsBits.Administrator) ?? false;

function send(msg: Message, content: string | MessageCreateOptions) {
  if (msg.channel.isSendable()) {
    return msg.channel.send(content);
  }
}

// Creates a command that calculates the chance to get something in N tries
function rngCalculator(chance: number, name = 'white box', action = 'pulls'): CommandHandler {
  return (msg, rollsArg) => {
    const rolls = Math.floor(Number(rollsArg));
    if (!rolls || rolls < 1) {
      return msg.reply(`I need a valid number of ${action}!`);
    }
    return msg.reply(`Chance to get at least 1 ${name} in ${rolls} ${action} is ${atLeastOneChance(chance, rolls).toFixed(2)}%`);
  };
}

export function poteto(msg: Message) {
  if (!msg.content.split(' ').some((word) => word.toLowerCase().includes('ahv'))) {
    return;
  }
  if (msg.author.id === potetoUserID) {
    potetoAmount++;
    return msg.reply('🥔'.repeat(potetoAmount));
  }
  if (randomNumber(1, 100) === 69) {
    return msg.reply('🥔'.repeat(69));
  }
  return msg.reply('🥔'.repeat(randomNumber(1, 7)) + ' alert!');
}

// Gives the whale role to everyone who writes in the whale channel.
// Not hooked up to messages at the moment, kept for when it's needed again.
export function whaleCheck(msg: Message) {
  if (!msg.inGuild() || !msg.member) {
    return;
  }
  const whaleChannelID = guildConfig.get(msg.guildId, 'whaleChannelID');
  const whaleRoleID = guildConfig.get(msg.guildId, 'whaleRoleID');
  if (whaleChannelID && whaleRoleID && msg.channelId === whaleChannelID) {
    return msg.member.roles.add(whaleRoleID).catch((err) => logger.error(err));
  }
}

// List of available prefix commands, command names have to be lowercase.
// If new command added to object below, it will automatically work
const commands: Record<string, CommandHandler> = {
  koreanews: async (msg) => {
    const news = await checkCafeNews();
    if (!news) {
      return msg.reply(`Couldn't get the latest korea news, try again later!`);
    }
    return msg.reply(`Latest korea news, posted at ${news.date}. ${news.url}`);
  },
  ping: (msg) => msg.reply('pong'),
  '500€': (msg) => msg.reply('no'),
  kang: (msg) => {
    const rng = randomNumber(1, 100);
    const [, url] = kangImages.find(([rngBelow]) => rng < rngBelow)!;
    return msg.reply(url);
  },
  poteto,
  animal: (msg, lengthArg = '3') => {
    const length = Math.floor(Number(lengthArg));
    if (!length || length < 1) {
      return msg.reply('I need a valid number of words!');
    }
    const generated = generateID(Math.min(length, maxAnimalWords), ' ');
    if (generated.length > maxAnimalLength) {
      // Cut it at the last full word, but keep the animal at the end
      const goodThings = /(.*?)\S*?$/.exec(generated.slice(0, maxAnimalLength))![1];
      const animalName = /\s(\S*?)$/.exec(generated)![1];
      return msg.reply(goodThings + animalName);
    }
    return msg.reply(generated);
  },
  help: (msg) => {
    const available = Object.keys(commands).filter((name) => !hiddenCommands.has(name));
    return msg.reply(`Available commads are: ${available.join(', ')}`);
  },
  botinvitelink: (msg) =>
    msg.reply('Bot invite link: https://discord.com/api/oauth2/authorize?client_id=835230514813730856&permissions=8&scope=bot%20applications.commands'),
  discordlink: (msg) => msg.reply('Devoleper discord link: https://discord.gg/ghFPrvAnXt'),
  colocalclink: (msg) => msg.reply('Check out the Colosseum calculator! https://thewwworm.github.io/'),
  whitebox: rngCalculator(1.375 * 2),
  bannerbox: rngCalculator(1.375),
  exwhitebox: rngCalculator(1 + 2),
  exbannerbox: rngCalculator(1),
  supercostume: rngCalculator(1, 'super costume', 'crafts'),
  merch: rngCalculator(3, 'unique merch', 'crafts'),
  defence: (msg, amountArg) => {
    const amount = Math.floor(Number(amountArg));
    if (!amount || amount < 1) {
      return msg.reply('I need a valid number of defence!');
    }
    return msg.reply(`With ${amount} defence, damage is reduced by ${defenceReduction(amount).toFixed(2)}%`);
  },
  maths: (msg, targetArg, difficultyArg = '10') => {
    const target = Number(targetArg);
    const difficulty = Math.min(Number(difficultyArg), 1000);
    if (!target) {
      return msg.reply('I need a valid target number!');
    }
    if (!difficulty) {
      return msg.reply('I need a valid difficulty number!');
    }
    let formula: string;
    try {
      formula = `\`${genMaths(target, difficulty)}\``;
    } catch {
      return msg.reply('Errored during formula generation!');
    }
    if (formula.length > maxMessageLength) {
      return msg.reply(`Stop sending asking for Big Chungus formulas! Discord can't handle more then ${maxMessageLength} characters!`);
    }
    return send(msg, formula);
  },
  dice: (msg, sidesArg = '6', minArg = '1') => {
    const sides = Number(sidesArg);
    const min = Number(minArg);
    return msg.reply(`Dice roll result is ${Math.floor(Math.random() * (sides - min + 1)) + min}`);
  },
  set: (msg, name, value) => {
    if (!msg.inGuild() || !isAdmin(msg)) {
      return msg.reply('You need to have admin rights to use this command');
    }
    if (!isGuildSetting(name)) {
      return msg.reply('You are trying to set unkown param! Please do give help setup, to check available commands!');
    }
    guildConfig.set(msg.guildId, name, value?.trim());
    return msg.react('✅');
  },
  setup: (msg) => msg.reply({ embeds: [{ title: 'Available "set" variables.', fields: setupHelpFields }] }),
  checksetup: (msg) => {
    if (!msg.inGuild() || !isAdmin(msg)) {
      return msg.reply('You need to have admin rights to use this command');
    }
    const setup = guildConfig.getFull(msg.guildId);
    if (!setup) {
      return msg.reply('There is no setup done yet!');
    }
    return msg.reply({ embeds: [{ title: 'Current setup.', fields: objToEmbedFields(setup) }] });
  },
  timetilreset: async (msg) => {
    await msg.delete().catch((err) => logger.warn(`Couldn't delete the message`, err));
    return send(msg, `Daily reset hits in ${timeUntilReset()} minutes!`);
  },
};

// Commands that work, but are not listed in "help"
const hiddenCommands = new Set(['poteto']);

export const commandHandlers = new Map(Object.entries(commands));
