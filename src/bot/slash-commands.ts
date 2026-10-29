import type { Client, Interaction, RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord.js';
import { getLogger } from '../logger.js';
import { timeUntilReset } from '../helpers.js';

const logger = getLogger('Slash commands');

const slashCommands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [
  {
    name: 'untilreset',
    description: 'Get time until the daily reset',
  },
];

// Creates (or updates) the bot's slash commands in the given guild
export async function registerSlashCommands(client: Client<true>, guildId: string): Promise<void> {
  logger.info('Registering slash commands for guild', guildId);
  try {
    const existing = await client.application.commands.fetch({ guildId });
    logger.info('Existing commands:', existing.map((cmd) => cmd.name).join(', ') || 'none');
    const created = await Promise.all(slashCommands.map((cmd) => client.application.commands.create(cmd, guildId)));
    logger.info('Registered commands:', created.map((cmd) => cmd.name).join(', '));
  } catch (err) {
    logger.error(`Errored while registering slash commands for guild ${guildId}`, err);
  }
}

export async function handleInteraction(interaction: Interaction): Promise<void> {
  if (!interaction.isChatInputCommand()) {
    return;
  }
  if (interaction.commandName === 'untilreset') {
    await interaction.reply(`Daily reset hits in ${timeUntilReset()} minutes!`);
  }
}
