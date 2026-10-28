import { Events, type Client, type Message } from 'discord.js';
import { getLogger } from '../logger.js';
import { settings } from '../settings.js';
import { guildConfig } from '../guild-config.js';
import { startCafeNewsCron } from '../news/cafe-checker.js';
import type { CafeNews } from '../news/cafe-parser.js';
import { client } from './client.js';
import { commandHandlers, poteto, type CommandHandler } from './commands.js';
import { handleInteraction, registerSlashCommands } from './slash-commands.js';

const logger = getLogger('Init');

// Words that look like mentions, links or maths don't trigger the poteto check
const isPotetoCandidate = (word: string) =>
  !/<.*?>.*?/.test(word) && !/http.*:\/\//.test(word) && !/[*/+-]/m.test(word);

async function runCommand(name: string, handler: CommandHandler, msg: Message, args: string[]) {
  try {
    await handler(msg, ...args);
  } catch (err) {
    logger.error(`Errored while running the "${name}" command`, err);
  }
}

function onMessage(msg: Message) {
  if (msg.author.bot) {
    return;
  }
  // Split message into arguments
  const args = msg.content.split(' ');
  const greet = args.shift()!.toLowerCase();
  // If message starts with valid greeting - run the command with the rest of arguments
  if (settings.botPrefixes.includes(greet)) {
    const command = args.shift()?.toLowerCase() ?? '';
    const handler = commandHandlers.get(command);
    if (handler) {
      void runCommand(command, handler, msg, args);
    }
  } else if (isPotetoCandidate(greet)) {
    void runCommand('poteto', poteto, msg, args);
  }
}

async function postNews(readyClient: Client<true>, news: CafeNews) {
  const msg = `Latest korea news, posted at ${news.date}. ${news.url}`;
  for (const [guildId, newsChannelID] of guildConfig.getValuePairs('newsChannelID')) {
    try {
      const channel = await readyClient.channels.fetch(newsChannelID);
      if (!channel?.isSendable()) {
        throw new Error(`Channel ${newsChannelID} is not a text channel`);
      }
      await channel.send(msg);
    } catch (err) {
      logger.error(`Errored while posting news to guild ${guildId}`, err);
    }
  }
}

export async function start(): Promise<void> {
  const prefixes = settings.botPrefixes;
  logger.info('Running in prod mode -', settings.isProd);
  logger.info('Available prefixes are:', prefixes.join(', '));

  client.once(Events.ClientReady, async (readyClient) => {
    readyClient.user.setActivity(`${prefixes[0]} help`);
    logger.info(`Logged in as ${readyClient.user.tag}!`);

    logger.info('Starting cafe news cron');
    startCafeNewsCron((news) => postNews(readyClient, news));

    for (const [guildId] of guildConfig.getValuePairs('ID')) {
      await registerSlashCommands(readyClient, guildId);
    }
  });

  client.on(Events.MessageCreate, onMessage);
  client.on(Events.InteractionCreate, (interaction) => {
    handleInteraction(interaction).catch((err) => logger.error('Errored while handling an interaction', err));
  });
  client.on(Events.Error, (err) => logger.error('Discord client error', err));

  await client.login(settings.discordToken);
}

export async function stop(): Promise<void> {
  await client.destroy();
}
