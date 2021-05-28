import Discord from 'discord.js';
import { startCafeNewsCron } from '../news-check/cafe-checker';
import { commandHandlers, createCoopRoom } from './commands';
import client from './login';
import log4js from 'log4js'
import { startKamazoneCron } from './kamazone-cron';
import config from '../config';

const logger = log4js.getLogger('Init');

logger.info('Running in prod mode - ', config.get('isProd'));

// @TODO: move this to separate file and fix the broken typing
// @NOTE: typing for commands API is lacking, so everything is more or less typed as any
function initCommands(guildID) {
  logger.info('Guild id is', guildID);
  // Wrap app in fn, because we need a new instance every time
  function getApp(guildId = guildID) {
    const app = client['api']['applications'](client.user.id);
    if (guildId) {
      app.guilds(guildId);
    }
    return app;
  }

  function reply(interatcion, msg: string) {
    client['api']['interactions'](interatcion.id, interatcion.token).callback.post({
      data: {
        type: 4,
        data: {
          content: msg
        }
      }
    })
  }

  // Check existing commands
  getApp().commands.get().then((cmd) => {
    logger.info(cmd);
    // Post new commands
    return getApp().commands.post({
      data: {
        name: 'coop',
        description: 'Create a co-op room!'
      }
    })
  }).then((updated) => {
    logger.info(updated)
  }).catch((err) => logger.error('Errored', err));

  // Listen to commands
  client.ws.on('INTERACTION_CREATE' as any, (interatcion: any) => {
    // @TODO: improve
    if (interatcion.data.name === 'coop') {
      createCoopRoom(interatcion.guild_id).then((coopResultMsg) => {
        reply(interatcion, coopResultMsg);
      });
    }
  });
}

export function start() {
  const msgStart = config.get('botPrefixes') as Array<string>
  logger.info('Available prefixes are:', msgStart.join(', '));

  logger.info('Starting cafe news cron');
  startCafeNewsCron((res) => {
    if (res) {
      const channels = config.getGuildValuePair('newsChannelID');
      channels.forEach(([guildID, newsChannelID]) => {
        const msg = `Latest korea news, posted at ${res.date}. ${res.url}`;
        const guild = new Discord.Guild(client, {
          id: guildID
        });
        const channel = new Discord.TextChannel(guild, {
          id: newsChannelID
        });
        channel.send(msg);
      });
    }
  })

  logger.info('Starting kamazone news cron');
  startKamazoneCron((res) => {
    if (res) {
      const channels = config.getGuildValuePair('kamazoneMentionChannelID');
      channels.forEach(([guildID, newsChannelID]) => {
        const roleID = config.getGuild(guildID, 'kamazoneRoleID');
        const msg = `${roleID ? `<@&${roleID}>` : 'Unset role!'} Don't forget to do Kama-ZONE! ${res.toFixed(1)} hours left until the round end!`;
        const guild = new Discord.Guild(client, {
          id: guildID
        });
        const channel = new Discord.TextChannel(guild, {
          id: newsChannelID
        });
        channel.send(msg);
      });
    }
  })

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
      };
    } catch (e) {
      logger.error('Errored during msg parse', e.stack);
    }
  });
}

