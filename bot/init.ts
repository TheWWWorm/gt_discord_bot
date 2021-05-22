import Discord from 'discord.js';
import { startCafeNewsCron } from '../news-check/cafe-checker';
import { commandHandlers, createCoopRoom } from './commands';
import client from './login';
import log4js from 'log4js'

const logger = log4js.getLogger('Init');

logger.info('Running in prod mode - ', process.env.PROD === 'true');

// @TODO: move this to separate file and fix the broken typing
// @NOTE: typing for commands API is lacking, so everything is more or less typed as any
function initCommands() {
  logger.info('Guild id is', process.env.GUILD_ID);
  // Wrap app in fn, because we need a new instance every time
  function getApp(guildId = process.env.GUILD_ID) {
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
  const msgStart = process.env.BOT_PREFIXES.split(',');
  logger.info('Available prefixes are:', msgStart.join(', '));

  if (process.env.NEWS_CHANNEL_ID) {
    logger.info('Starting cafe news cron');
    startCafeNewsCron((res) => {
      if (res) {
        const msg = `Latest korea news, posted at ${res.date}. Use browser translator to read. ${res.url}`;
        const guild = new Discord.Guild(client, {
          id: process.env.GUILD_ID
        });
        const channel = new Discord.TextChannel(guild, {
          id: process.env.NEWS_CHANNEL_ID
        });
        channel.send(msg);
      }
    })
  }

  client.on('ready', () => {
    client.user.setActivity(`${msgStart[0]} help`)
    logger.info(`Logged in as ${client.user.tag}!`)
    initCommands();
  })

  let unlocked = true;

  // Allows bot "disabling" for delepment purposes
  // So 2 bots can co-exist without replying to the same message twice) 
  // Bots should have different lock/unlock commands
  function checkLock(arg: string, msg: Discord.Message) {
    if (arg === process.env.LOCK_SECRET) {
      logger.info('Recieved lock command, bot is locking!');
      msg.react('✅');
      unlocked = false;
    } else if (arg === process.env.UNLOCK_SECRET) {
      unlocked = true
      msg.react('✅');
      logger.info('Recieved unlock command, bot is unlocking!');
    };
    return unlocked;
  }

  client.on('message', msg => {
    try {
      // Split message into arguments
      const args = msg.content.split(' ');
      const greet = args.shift().toLocaleLowerCase();
      // Return if we are locked
      if (!checkLock(greet, msg)) {
        return;
      }
      commandHandlers.whaleCheck(msg);
      // If message starts with valid greeting - continue
      if (~msgStart.indexOf(greet)) {
        const command = args.shift().toLowerCase();
        // In commands exists - execute if with the rest of arguments
        if (commandHandlers[command]) {
          commandHandlers[command](msg, ...args);
        }
      // If message fits the "cat" ctiteriea, execute the cat command
      } else if (greet.length > Number(process.env.CAT_TRIGGER_LENGTH) && !/<.*?>.*?/.test(greet) && !/http.*:\/\//.test(greet) && !/[\*\/\+-]/m.test(greet)) {
        commandHandlers.cat(msg);
      };
    } catch (e) {
      logger.error('Errored during msg parse', e.stack);
    }
  });
}

