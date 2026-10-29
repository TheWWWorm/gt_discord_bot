import { readDB, writeDB } from './db.js';

export type GuildConfig = {
  ID: string;
  coopChannelID?: string;
  catRoleID?: string;
  whaleRoleID?: string;
  whaleChannelID?: string;
  newsChannelID?: string;
  kamazoneRoleID?: string;
  kamazoneMentionChannelID?: string;
  hideAndSeekChannelID?: string;
  hideAndSeekMsgID?: string;
};

// Values that can be changed by server admins with the "set" command
export const configHelp = {
  coopChannelID: 'ID of the parent channel, that will contain new co-op channels',
  catRoleID: 'ID of a cat role',
  whaleRoleID: 'ID of a whale role',
  whaleChannelID: 'ID of a whale channel',
  newsChannelID: 'ID of a korean news channel',
  kamazoneRoleID: 'ID of role to remind about KAMA-zone',
  kamazoneMentionChannelID: 'ID of the channel where KAMA-zone reminder will be sent',
  hideAndSeekChannelID: 'ID of the channel with recods of hide and seek',
} satisfies Partial<Record<keyof GuildConfig, string>>;

export type GuildSetting = keyof typeof configHelp;

export const isGuildSetting = (name: string | undefined): name is GuildSetting =>
  name !== undefined && Object.hasOwn(configHelp, name);

const dbName = 'config';
const guildConfigs = readDB<GuildConfig>(dbName);

const findGuild = (guildId: string) => guildConfigs.find((guild) => guild.ID === guildId);

export const guildConfig = {
  get(guildId: string, name: keyof GuildConfig): string | null {
    return findGuild(guildId)?.[name] || null;
  },
  getFull(guildId: string): GuildConfig | undefined {
    return findGuild(guildId);
  },
  // [guildID, value] pairs of every guild that has the value set
  getValuePairs(name: keyof GuildConfig): Array<[guildId: string, value: string]> {
    return guildConfigs.flatMap((guild) => (guild[name] ? [[guild.ID, guild[name]] as [string, string]] : []));
  },
  set(guildId: string, name: GuildSetting, value: string | undefined): void {
    let guild = findGuild(guildId);
    if (!guild) {
      guild = { ID: guildId };
      guildConfigs.push(guild);
    }
    guild[name] = value;
    writeDB(dbName, guildConfigs);
  },
};
