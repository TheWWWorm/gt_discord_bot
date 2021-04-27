import Discord from 'discord.js';

const client = new Discord.Client();
const TOKEN = process.env.DISCORD_TOKEN;
client.login(TOKEN);

export default client;