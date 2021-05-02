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

  // Allows bot "disabling" for delepment purposes
  // So 2 bots can co-exist without replying to the same message twice) 
  // Bots should have different lock/unlock commands
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
    // Split message into arguments
    const args = msg.content.split(' ');
    const greet = args.shift().toLocaleLowerCase();
    // Return if we are locked
    if (!checkLock(greet, msg)) {
      return;
    }
    // If message starts with valid greeting - continue
    if (~msgStart.indexOf(greet)) {
      const command = args.shift().toLowerCase();
      // In commands exists - execute if with the rest of arguments
      if (cmdResolver[command]) {
        cmdResolver[command](msg, ...args);
      }
    // If message fits the "cat" ctiteriea, execute the cat command
    } else if (greet.length > Number(process.env.CAT_TRIGGER_LENGTH) && !/<.*?>.*?/.test(greet) && !/http.*:\/\//.test(greet)) {
      cmdResolver.cat(msg);
    };
  });
}

