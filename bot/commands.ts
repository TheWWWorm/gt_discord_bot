import Discord from 'discord.js';
import animalIds from 'animal-ids';
import coopWatcher from './room-watcher';
import client from './login';
import { checkCafeUrls } from '../news-check/cafe-checker';
import { genMaths } from './maths';
import log4js from 'log4js'

const logger = log4js.getLogger('Commands');

const minutesUntilDeletion: number = Number(process.env.COOP_CHANNEL_MAX_INACTIVE_TIME);
const coopChannelID = process.env.COOP_CHANNEL_ID;
const catRoleID = process.env.CAT_ROLE_ID;

const whaleChannelID = process.env.WHALE_CHANNEL_ID;
const whaleRoleID = process.env.WHALE_ROLE_ID;

// Function for creating rng based calculation functions
function getRngCalculator(chance: number) {
  return (msg: Discord.Message, rolls) => {
    rolls = Math.floor(Number(rolls));
    if (!rolls || rolls < 1) {
      return msg.reply('I need a valid number of summons!');
    }
    const atLeast1Rng = (1 - ((100 - chance) / 100) ** rolls) * 100;
    msg.reply(`Chance to get at least 1 white box in ${rolls} pulls is ${atLeast1Rng.toFixed(2)}%`);
  }
}

export const createCoopRoom = (guildId: string): Promise<string> => {
  const guild = new Discord.Guild(client, {
    id: guildId
  });
  const guildChannelManager = new Discord.GuildChannelManager(guild);
  const roomName = `🤝co-op-${animalIds.generateID(2, '-')}`;
  // Create new co-op channel under defined catergory
  return guildChannelManager.create(roomName, {
    parent: new Discord.Channel(client, {
      id: coopChannelID
    })
  }).then((ch) => {
    // Initiate the room watcher, so it will get deleted after some time of inactivity
    coopWatcher.addRoom({
      channelId: ch.id,
      guildId: ch.guild.id
    });
    return `Room created with name <#${ch.id}>! Room will be deleted after ${minutesUntilDeletion} minutes of inactivity!`;
  }).catch((err) => {
    logger.error(err);
    return 'Errored during room creation!';
  });
}

// @TODO: rewrite, so commands won't depend on Discord.Message, they should just take required params, so they can work with commands!
// List of available bot commands
// If new command added to object below, it will automatically work
const commands = {
  koreanews: (msg: Discord.Message) => {
    checkCafeUrls().then((url) => {
      msg.reply(`Latest korea news, posted at ${url.date}. ${url.url}`);
    });
  },
  coop: (msg: Discord.Message) => {
    createCoopRoom(msg.guild.id).then((coopResultText) => {
      msg.reply(coopResultText);
    });
  },
  ping: (msg: Discord.Message) => {
    msg.reply("pong");
  },
  '500€': (msg: Discord.Message) => {
    msg.reply("no");
  },
  cat: (msg: Discord.Message) => {
    const RoleManager = new Discord.GuildMemberRoleManager(msg.member);
    // Set cat role
    RoleManager.add([catRoleID]).catch(logger.error);
    msg.reply('Cat alert!');
  },
  animal: (msg, length = 3) => {
    const generated =  animalIds.generateID(length, ' ');
    if (generated.length > 1500) {
      const goodThings = /(.*?)\S*?$/.exec(generated.substr(0, 1500))[1];
      const animalName = /\s(\S*?)$/.exec(generated)[1];
      return msg.reply(goodThings + animalName);
    }
    msg.reply(generated);
  },
  help: (msg: Discord.Message) => {
    // Get all the avalable commands from this objects keys/properties
    msg.reply(`Available commads are: ${Object.keys(commands).filter((name) => ['cat', 'test', 'whaleCheck'].indexOf(name) === -1).join(', ')}`);
  },
  whaleCheck: (msg: Discord.Message) => {
    if (msg.channel.id === whaleChannelID) {
      const RoleManager = new Discord.GuildMemberRoleManager(msg.member);
      // Set whale role
      RoleManager.add([whaleRoleID]).catch(logger.error);
    }
  },
  whitebox: getRngCalculator(1.375 * 2),
  bannerbox: getRngCalculator(1.375),
  exwhitebox: getRngCalculator(1 + 2),
  exbannerbox: getRngCalculator(1),
  defence: (msg: Discord.Message, amount) => {
    amount = Math.floor(Number(amount));
    if (!amount || amount < 1) {
      return msg.reply('I need a valid number of defence!');
    }
    const reduction = (1 - 1 / (amount / 100 + 1)) * 100;
    msg.reply(`With ${amount} defence, damage is reduced by ${reduction.toFixed(2)}%`);
  },
  maths: (msg: Discord.Message, target, difficulty = 10) => {
    try {
      target = Number(target);
      difficulty = difficulty = Math.min(Number(difficulty), 1000);
      if (!target) {
        return msg.reply('I need a valid target number!');
      }
      if (!difficulty) {
        return msg.reply('I need a valid difficulty number!');
      }
      msg.channel.send(`\`${genMaths(target, difficulty)}\``);
    } catch (e) {
      msg.reply('Errored during formula generation!');
    }
  },
  dice: (msg: Discord.Message, sides = 6, min = 1) => {
    sides = Number(sides);
    min = Number(min);
    msg.reply(`Dice roll result is ${Math.floor(Math.random() * (sides - min + 1)) + min}`);
  }
};

export const commandHandlers = commands;