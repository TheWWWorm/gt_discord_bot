import { getLogger } from 'log4js'
import { createCoopRoom, timeUntilReset } from './commands';
import client from './login';

const logger = getLogger('Init');

type Command = {
  name: string
  description: string
}

const commands: Array<Command> = [
  {
    name: 'coop',
    description: 'Create a co-op room!'
  },
  {
    name: 'untilreset',
    description: 'Get time until the daily reset'
  }
]

// @NOTE: typing for commands API is lacking, so everything is more or less typed as any
export function initCommands(guildID) {
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
    return Promise.all(
      commands.map((cmd) => {
        return getApp().commands.post({
          data: cmd
        })
      })
    )
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
    if (interatcion.data.name === 'untilreset') {
      reply(interatcion, `Daily reset hits in ${timeUntilReset()} minutes!`)
    }
  });
}
