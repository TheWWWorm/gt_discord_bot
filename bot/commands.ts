import { EmbedFieldData, Guild, GuildChannelManager, Channel, Message, GuildMemberRoleManager } from 'discord.js';
import animalIds from 'animal-ids';
import coopWatcher from './room-watcher';
import client from './login';
import { checkCafeUrls } from '../news-check/cafe-checker';
import { genMaths } from './maths';
import { getLogger } from 'log4js';
import config, { configHelp } from '../config';
import { addPoint, repostMessage } from './point-counter';
import { getRngCalculator, objToEmbed, randomNumber } from '../shared/helpers';

const logger = getLogger('Commands');

const minutesUntilDeletion = config.get('coopMaxInaciveTime');
let potetoAmount = 0;

export const createCoopRoom = (guildId: string): Promise<string> => {
  const guild = new Guild(client, {
    id: guildId
  });
  const coopChannelID = config.getGuild(guildId, 'coopChannelID');
  if (!coopChannelID) {
    return Promise.resolve('No coopChannelID found for this discord server! Please run the setup!');
  }
  const guildChannelManager = new GuildChannelManager(guild);
  const roomName = `🤝co-op-${animalIds.generateID(2, '-')}`;
  // Create new co-op channel under defined catergory
  return guildChannelManager.create(roomName, {
    parent: new Channel(client, {
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

export const timeUntilReset = () => {
  const minutesInDay = new Date().getMinutes() + (new Date().getHours() * 60)
  const timeTill = 60 * 24 - minutesInDay;
  return timeTill;
}

const guildSetOptions = Object.keys(configHelp);
const mappedEmbed: Array<EmbedFieldData> = objToEmbed(configHelp);

// @TODO: rewrite, so commands won't depend on Discord.Message, they should just take required params, so they can work with commands!
// List of available bot commands
// If new command added to object below, it will automatically work
const commands = {
  koreanews: (msg: Message) => {
    checkCafeUrls().then((url) => {
      msg.reply(`Latest korea news, posted at ${url.date}. ${url.url}`);
    });
  },
  coop: (msg: Message) => {
    createCoopRoom(msg.guild.id).then((coopResultText) => {
      msg.reply(coopResultText);
    });
  },
  ping: (msg: Message) => {
    msg.reply("pong");
  },
  '500€': (msg: Message) => {
    msg.reply("no");
  },
  'kang': (msg: Message) => {
    const rng = randomNumber(1, 100);
    if (rng < 50) {
      msg.reply('https://cdn.discordapp.com/attachments/859857183625576450/929899362639835176/free_kang.png');
    } else if (rng < 60) {
      msg.reply('https://cdn.discordapp.com/attachments/859857183625576450/930145483605803078/free_kang_lp.png')
    } else if (rng < 65) {
      msg.reply('https://cdn.discordapp.com/attachments/930468197893808139/932037958373109840/free_kang_lapice.png')
    } else if (rng < 70) {
      msg.reply('https://cdn.discordapp.com/attachments/859857183625576450/930148374571798588/free_kang_egg.png')
    } else if (rng < 75) {
      msg.reply('https://cdn.discordapp.com/attachments/930468197893808139/930559007305924648/free_kanna.png')
    } else if (rng < 80) {
      msg.reply('https://cdn.discordapp.com/attachments/859857183625576450/930150768680517662/free_rick_roll.png')
    } else if (rng < 85) {
      msg.reply('https://cdn.discordapp.com/attachments/860540258570731572/930469675039596595/kang_drip.png')
    } else if (rng < 95) {
      msg.reply('https://cdn.discordapp.com/attachments/859857183625576450/930141593850220635/no_more_free_kang.png')
    } else {
      msg.reply('https://cdn.discordapp.com/attachments/860540258570731572/930462437512208464/golden_kang.png');
    }
  },
  cat: (msg: Message) => {
    const guildId = msg.guild.id;
    const catRoleID = config.getGuild(guildId, 'catRoleID');
    if (!catRoleID) {
      return;
    }
    const RoleManager = new GuildMemberRoleManager(msg.member);
    // Set cat role
    RoleManager.add([catRoleID]).catch(logger.error);
    msg.reply('Cat alert!');
  },
  poteto: (msg: Message) => {
    if (msg.content.split(' ').find((word) => word.toLowerCase().includes('ahv'))) {
      if (msg.author.id === '231048989980622849') {
        potetoAmount = potetoAmount + 1;
        return msg.reply('🥔'.repeat(potetoAmount));
      }
      if (randomNumber(1, 100) === 69) {
        return msg.reply('🥔'.repeat(69));
      }
      msg.reply('🥔'.repeat(randomNumber(1, 7)) + ' alert!');
    }
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
  help: (msg: Message) => {
    // Get all the avalable commands from this objects keys/properties
    msg.reply(`Available commads are: ${Object.keys(commands).filter((name) => ['cat', 'test', 'whaleCheck', 'poteto'].indexOf(name) === -1).join(', ')}`);
  },
  botinvitelink: (msg: Message) => {
    // Invite bot to your server
    msg.reply(`Bot invite link: https://discord.com/api/oauth2/authorize?client_id=835230514813730856&permissions=8&scope=bot%20applications.commands`);
  },
  discordlink: (msg: Message) => {
    // Join the discord
    msg.reply(`Devoleper discord link: https://discord.gg/ghFPrvAnXt`);
  },
  colocalclink: (msg: Message) => {
    // Link to colo-calc
    msg.reply(`Check out the Colosseum calculator! https://thewwworm.github.io/`);
  },
  whaleCheck: (msg: Message) => {
    const guildId = msg.guild.id;
    const whaleChannelID = config.getGuild(guildId, 'whaleChannelID');
    const whaleRoleID = config.getGuild(guildId, 'whaleRoleID');
    if (!whaleChannelID || !whaleRoleID) {
      return;
    }
    if (msg.channel.id === whaleChannelID) {
      const RoleManager = new GuildMemberRoleManager(msg.member);
      // Set whale role
      RoleManager.add([whaleRoleID]).catch(logger.error);
    }
  },
  whitebox: getRngCalculator(1.375 * 2),
  bannerbox: getRngCalculator(1.375),
  exwhitebox: getRngCalculator(1 + 2),
  exbannerbox: getRngCalculator(1),
  supercostume: getRngCalculator(1, 'super costume', 'crafts'),
  merch: getRngCalculator(3, 'unique merch', 'crafts'),
  defence: (msg: Message, amount) => {
    amount = Math.floor(Number(amount));
    if (!amount || amount < 1) {
      return msg.reply('I need a valid number of defence!');
    }
    const reduction = (1 - 1 / (amount / 100 + 1)) * 100;
    msg.reply(`With ${amount} defence, damage is reduced by ${reduction.toFixed(2)}%`);
  },
  maths: (msg: Message, target, difficulty = 10) => {
    try {
      target = Number(target);
      difficulty = difficulty = Math.min(Number(difficulty), 1000);
      if (!target) {
        return msg.reply('I need a valid target number!');
      }
      if (!difficulty) {
        return msg.reply('I need a valid difficulty number!');
      }
      msg.channel.send(`\`${genMaths(target, difficulty)}\``).catch(() => {
        msg.reply('Stop sending asking for Big Chungus formulas! Discord can\'t handle more then 2000 characters!');
      })
    } catch (e) {
      msg.reply('Errored during formula generation!');
    }
  },
  dice: (msg: Message, sides = 6, min = 1) => {
    sides = Number(sides);
    min = Number(min);
    msg.reply(`Dice roll result is ${Math.floor(Math.random() * (sides - min + 1)) + min}`);
  },
  set:(msg: Message, name, value: string) => {
    if (!msg.member.hasPermission('ADMINISTRATOR')) {
      return msg.reply('You need to have admin rights to use this command')
    }
    if (!guildSetOptions.includes(name)) {
      return msg.reply('You are trying to set unkown param! Please do give help setup, to check available commands!');
    }
    if (value) {
      value = value.trim();
    }
    config.setGuild(msg.guild.id, name, value);
    msg.react('✅');
  },
  setup:(msg: Message) => {
    msg.reply({
      title: 'Available "set" variables.',
      embed: {
        fields: mappedEmbed
      }
    })
  },
  checksetup:(msg: Message) => {
    if (!msg.member.hasPermission('ADMINISTRATOR')) {
      return msg.reply('You need to have admin rights to use this command')
    }
    const setup = config.getFullGuildConfig(msg.guild.id);
    if (!setup) {
      return msg.reply('There is no setup done yet!');
    }
    msg.reply({
      title: 'Available "set" variables.',
      embed: {
        fields: objToEmbed(setup)
      }
    })
  },
  timetilreset:(msg: Message) => {
    msg.delete();
    msg.channel.send(`Daily reset hits in ${timeUntilReset()} minutes!`)
  },
  point:(msg: Message, target: string, amount = '1') => {  
    if (!msg.member.hasPermission('ADMINISTRATOR')) {
      return msg.reply('You need to have admin rights to use this command')
    }
    const exectued = /(\d+)/.exec(target)
    if (!exectued || !exectued[1]) {
      return msg.reply('You need to select the target to give points to')
    }
    target = exectued[1];
    const parsedAmount = parseInt(amount)
    if (!parsedAmount) {
      return msg.reply('You need to enter valid amount of points to give')
    }
    target = exectued[1];
    const guildID = msg.guild.id;
    const channelID = config.getGuild(guildID, 'hideAndSeekChannelID');
    if (!channelID) {
      return msg.reply('Please set hideAndSeekChannelID first!');
    }
    addPoint(guildID, target, parsedAmount);
    repostMessage(guildID, channelID);
  },
};

export const commandHandlers = commands;