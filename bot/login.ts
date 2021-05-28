import Discord from 'discord.js';
import config from '../config';

const client = new Discord.Client();
const TOKEN = config.get('discordToken') as string;
client.login(TOKEN);

export default client;