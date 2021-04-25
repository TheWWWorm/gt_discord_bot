import Discord from 'discord.js';
import animalIds from 'animal-ids';

const minutesUntilDeletion: number = Number(process.env.COOP_CHANNEL_MAX_INACTIVE_TIME);
const coopChannelID = process.env.COOP_CHANNEL_ID;
const catRoleID = process.env.CAT_ROLE_ID;
const coopChannelDeleteIn = 1e3 * 60 * minutesUntilDeletion;

function getRngCalculator(chance) {
  return (msg: Discord.Message, rolls) => {
    rolls = Math.floor(Number(rolls));
    if (!rolls || rolls < 1) {
      return msg.reply('I need a valid number of summons!');
    }
    const atLeast1Rng = (1 - ((100 - chance) / 100) ** rolls) * 100;
    msg.reply(`Chance to get at least 1 white box in ${rolls} pulls is ${atLeast1Rng.toFixed(2)}%`);
  }
}

const commands = {
  coop: (msg: Discord.Message) => {
    const guildChannelManager = new Discord.GuildChannelManager(msg.guild);
    const roomName = `🤝co-op-${animalIds.generateID(2, '-')}`;
    guildChannelManager.create(roomName, {
      parent: new Discord.Channel(msg.client, {
        id: coopChannelID
      })
    }).then((ch) => {
      msg.reply(`Room created with name <#${ch.id}>! Room will be deleted after ${minutesUntilDeletion} minutes of inactivity!`);
      function sheduleTheDeletion() {
        setTimeout(() => {
          console.log(Date.now(), ch.lastMessage?.createdTimestamp);
          if (!ch.lastMessage?.createdTimestamp || Date.now() - ch.lastMessage?.createdTimestamp > coopChannelDeleteIn) {
            ch.delete()
          } else {
            sheduleTheDeletion();
          }
        }, coopChannelDeleteIn)
      };
      sheduleTheDeletion();
    }).catch(console.error);
  },
  ping: (msg: Discord.Message) => {
    msg.reply("pong");
  },
  '500€': (msg: Discord.Message) => {
    msg.reply("no");
  },
  cat: (msg: Discord.Message) => {
    const RoleManager = new Discord.GuildMemberRoleManager(msg.member);
    // Set cat role
    RoleManager.add([catRoleID]).catch(console.error);
    msg.reply('Cat alert!');
  },
  animal: (msg, length = 3) => {
    msg.reply(animalIds.generateID(length, ' '));
  },
  help: (msg: Discord.Message) => {
    msg.reply(`Available commads are: ${Object.keys(commands).filter((name) => ['cat', 'test'].indexOf(name) === -1).join(', ')}`);
  },
  // TODO: allow for rng of banner units(note, that regular boxes can also result in banner stuff), weapon summons
  whitebox: getRngCalculator(1.375 * 2),
  bannerbox: getRngCalculator(1.375),
  exwhitebox: getRngCalculator(1 + 2),
  exbannerbox: getRngCalculator(1),
  defence: (msg: Discord.Message, amount) => {
    amount = Math.floor(Number(amount));
    if (!amount || amount < 1) {
      return msg.reply('I need a valid number of defence!');
    }
    const reduction = (1 - 1 / (amount / 100 + 1)) * 100;
    msg.reply(`With ${amount} defence, damage is reduced by ${reduction.toFixed(2)}%`);
  }
};

export default commands;