// READ params from .env file
import dotenv from 'dotenv';
dotenv.config();
import Discord from 'discord.js';
import cmdResolver from './commands';

const client = new Discord.Client()

const TOKEN = process.env.DISCORD_TOKEN;
const msgStart = ['gib', 'geben', 'git', 'sudo'];

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

client.on('message', msg => {
  const args = msg.content.split(' ');
  const greet = args.shift().toLocaleLowerCase();
  if (~msgStart.indexOf(greet)) {
    const command = args.shift().toLowerCase();
    if (cmdResolver[command]) {
      cmdResolver[command](msg, ...args);
    }
  } else if (greet.length > 15 && !/<.*?>.*?/.test(greet) && !/http.*:\/\//.test(greet)) {
    cmdResolver.cat(msg);
  }
});

client.login(TOKEN);