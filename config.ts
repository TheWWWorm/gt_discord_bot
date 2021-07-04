import { readDB, writeDB } from "./db/db_helper";

type GuildConfig = {
  ID: string,
  coopChannelID?: string,
  catRoleID?: string,
  whaleRoleID?: string,
  whaleChannelID?: string,
  newsChannelID?: string,
  kamazoneRoleID?: string,
  kamazoneMentionChannelID?: string,
  hideAndSeekChannelID?: string,
  hideAndSeekMsgID?: string,
}

type GuildValuePair = [string, string];

export const configHelp = {
  //ID: 'ID of your discord server. Set automatically',
  coopChannelID: 'ID of the parent channel, that will contain new co-op channels',
  catRoleID: 'ID of a cat role',
  whaleRoleID: 'ID of a whale role',
  whaleChannelID: 'ID of a whale channel',
  newsChannelID: 'ID of a korean news channel',
  kamazoneRoleID: 'ID of role to remind about KAMA-zone',
  kamazoneMentionChannelID: 'ID of the channel where KAMA-zone reminder will be sent',
  hideAndSeekChannelID: 'ID of the channel with recods of hide and seek',
  //hideAndSeekMsgID: 'ID of the message with recods of hide and seek'
}

const dbName = 'config';
let guildConfigs: Array<GuildConfig> = readDB(dbName);
let generalConfig = {
  coopMaxInaciveTime: Number(process.env.COOP_CHANNEL_MAX_INACTIVE_TIME),
  catMsgLenght: Number(process.env.CAT_TRIGGER_LENGTH),
  kamazoneStartDate: process.env.KM_START_DATE,
  isProd: process.env.PROD === 'true',
  botPrefixes: process.env.BOT_PREFIXES.split(','),
  discordToken: process.env.DISCORD_TOKEN,
}

const config = {
  get: (name: keyof typeof generalConfig) => {
    return generalConfig[name];
  },
  getGuild: (guildId: string, name: keyof GuildConfig) => {
    const guild = guildConfigs.find((guild) => guild.ID === guildId);
    if (!guild || !guild[name]) {
      return null;
    }
    return guild[name];
  },
  getFullGuildConfig: (guildId: string): GuildConfig => {
    const guild = guildConfigs.find((guild) => guild.ID === guildId);
    return guild;
  },
  getGuildValuePair: (name: keyof GuildConfig): Array<GuildValuePair> => {
    return guildConfigs.reduce((acc, guild) => {
      if (guild[name]) {
        acc.push([guild.ID, guild[name]])
      }
      return acc;
    }, []);
  },
  setGuild: (guildId: string, name: keyof GuildConfig, value: string) => {
    let guild = guildConfigs.find((guild) => guild.ID === guildId);
    if (!guild) {
      guild = {
        ID: guildId 
      }
      guildConfigs.push(guild);
    }
    guild[name] = value;
    writeDB(dbName, guildConfigs);
  },
};

export default config;