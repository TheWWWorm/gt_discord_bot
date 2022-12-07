import { Guild, TextChannel } from 'discord.js';
import { startCafeNewsCron } from '../news-check/cafe-checker';
import { commandHandlers } from './commands';
import client from './login';
import { getLogger } from 'log4js'
import { startKamazoneCron } from './kamazone-cron';
import config from '../config';
import { initCommands } from './slash-cmd';

const logger = getLogger('Init');

logger.info('Running in prod mode - ', config.get('isProd'));

export function start() {
  const msgStart = config.get('botPrefixes') as Array<string>
  logger.info('Available prefixes are:', msgStart.join(', '));

  logger.info('Starting cafe news cron');
  startCafeNewsCron((res) => {
    if (res) {
      const channels = config.getGuildValuePair('newsChannelID');
      channels.forEach(([guildID, newsChannelID]) => {
        const msg = `Latest korea news, posted at ${res.date}. ${res.url}`;
        const guild = new Guild(client, {
          id: guildID
        });
        const channel = new TextChannel(guild, {
          id: newsChannelID
        });
        channel.send(msg);
      });
    }
  })

  if (config.get('kamazoneStartDate')) {
    logger.info('Starting kamazone news cron');
    startKamazoneCron((res) => {
      if (res) {
        const channels = config.getGuildValuePair('kamazoneMentionChannelID');
        channels.forEach(([guildID, newsChannelID]) => {
          const roleID = config.getGuild(guildID, 'kamazoneRoleID');
          const msg = `${roleID ? `<@&${roleID}>` : 'Unset role!'} Don't forget to do Kama-ZONE! ${res.toFixed(1)} hours left until the round end!`;
          const guild = new Guild(client, {
            id: guildID
          });
          const channel = new TextChannel(guild, {
            id: newsChannelID
          });
          channel.send(msg);
        });
      }
    })
  }

  client.on('ready', () => {
    client.user.setActivity(`${msgStart[0]} help`)
    logger.info(`Logged in as ${client.user.tag}!`)
    const guildIDs = config.getGuildValuePair('ID');
    guildIDs.forEach(([guildID]) => {
      initCommands(guildID);
    });
  })

  client.on('message', msg => {
    if (msg.author.bot) {
      return;
    }
    try {
      // Split message into arguments
      const args = msg.content.split(' ');
      const greet = args.shift().toLocaleLowerCase();
      commandHandlers.whaleCheck(msg);
      // If message starts with valid greeting - continue
      if (~msgStart.indexOf(greet)) {
        const command = args.shift().toLowerCase();
        // In commands exists - execute if with the rest of arguments
        if (commandHandlers[command]) {
          commandHandlers[command](msg, ...args);
        }
      // If message fits the "cat" ctiteriea, execute the cat command
      } else if (greet.length > Number(config.get('catMsgLenght')) && !/<.*?>.*?/.test(greet) && !/http.*:\/\//.test(greet) && !/[\*\/\+-]/m.test(greet)) {
        commandHandlers.cat(msg);
      } else if (!/<.*?>.*?/.test(greet) && !/http.*:\/\//.test(greet) && !/[\*\/\+-]/m.test(greet)) {
        commandHandlers.poteto(msg);
      };
    } catch (e) {
      logger.error('Errored during msg parse', e.stack);
    }
  });
}

