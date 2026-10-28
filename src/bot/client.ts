import { Client, GatewayIntentBits, Partials } from 'discord.js';

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    // Privileged intent, has to be enabled in the Discord developer portal for prefix commands to work
    GatewayIntentBits.MessageContent,
  ],
  // DM channels aren't cached, so they come in as partials
  partials: [Partials.Channel],
});
