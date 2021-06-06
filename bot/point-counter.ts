import config from '../config';
import { readDB, writeDB } from '../db/db_helper';
import Discord from "discord.js";
import client from './login';
import { objToEmbed } from '../shared/helpers';
import log4js from 'log4js'

const logger = log4js.getLogger('Point Counter');


type GuildScore = {
  guildID: string;
  memberScores: {
    [name: string]: string
  }
}

const dbName = 'hideAndSeekScores';
let scores: Array<GuildScore> = readDB(dbName)

export function addPoint(guildID: string, targetID: string, parsedAmount: number) {
  let guild = scores.find((guildScore) => guildScore.guildID === guildID);
  if (!guild) {
    guild = {
      guildID,
      memberScores: {}
    }
    scores.push(guild);
  }
  if (guild.memberScores[targetID]) {
    guild.memberScores[targetID] = String(Number(guild.memberScores[targetID]) + parsedAmount);
  } else {
    guild.memberScores[targetID] = String(parsedAmount);
  }
  writeDB(dbName, scores);
}

export function repostMessage(guildID, channelID) {
  const currentMsgID = config.getGuild(guildID, 'hideAndSeekMsgID');
  const guild = new Discord.Guild(client, {
    id: guildID
  });
  const channel = new Discord.TextChannel(guild, {
    id: channelID
  });

  let guildScores = scores.find((guildScore) => guildScore.guildID === guildID).memberScores;
  
  guild.fetch().then((fetchedGuild) => {
    return Promise.all(Object.keys(guildScores).map((userID) => {
      return new Discord.GuildMember(client, {
        user: {
          id: userID
        }
      }, fetchedGuild).fetch().catch(() => {
        delete guildScores[userID];
        channel.send('Errored, please try again!');
        return Promise.reject(`Invalid user id ${userID}`);
      });
    }));
  }).then((members: Array<Discord.GuildMember>) => {
    return channel.send({
      title: 'Scores',
      embed: {
        fields: objToEmbed(guildScores).map((element, i) => {
          const user = members[i];
          return {
            name: user.nickname || user.displayName || user.user.username,
            value: element.value + ' points'
          };
        })
      }
    })
  }).then((msg) => {
    config.setGuild(guildID, 'hideAndSeekMsgID', msg.id);
    msg.pin();

    if (currentMsgID) {
      const msg = new Discord.Message(client, {
        id: currentMsgID
      }, channel);
      msg.delete();
    } 
  }).catch((err) => {
    logger.error(err);
  })
}