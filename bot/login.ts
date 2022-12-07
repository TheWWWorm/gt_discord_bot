import { Client } from 'discord.js';
import config from '../config';

const client = new Client();
const TOKEN = config.get('discordToken') as string;
client.login(TOKEN);

export default client;