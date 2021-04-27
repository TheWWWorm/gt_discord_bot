import Discord from 'discord.js';
import cmdResolver from './commands';
import client from './login';

export function start() {
  const msgStart = process.env.BOT_PREFIXES.split(',');
  console.log('Available prefixes are:', msgStart.join(', '));

  client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`)
  })

  let unlocked = true;

  function checkLock(arg: string, msg: Discord.Message) {
    if (arg === process.env.LOCK_SECRET) {
      console.log('Recieved lock command, bot is locking!');
      msg.react('✅');
      unlocked = false;
    } else if (arg === process.env.UNLOCK_SECRET) {
      unlocked = true
      msg.react('✅');
      console.log('Recieved unlock command, bot is unlocking!');
    };
    return unlocked;
  }

  client.on('message', msg => {
    const args = msg.content.split(' ');
    const greet = args.shift().toLocaleLowerCase();
    if (!checkLock(greet, msg)) {
      return;
    }
    if (~msgStart.indexOf(greet)) {
      const command = args.shift().toLowerCase();
      if (cmdResolver[command]) {
        cmdResolver[command](msg, ...args);
      }
    } else if (greet.length > Number(process.env.CAT_TRIGGER_LENGTH) && !/<.*?>.*?/.test(greet) && !/http.*:\/\//.test(greet)) {
      cmdResolver.cat(msg);
    };
  });
}

