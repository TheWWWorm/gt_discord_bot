import config from '../config';
import { readDB, writeDB } from '../db/db_helper';
import { Guild, TextChannel, GuildMember, Message } from "discord.js";
import client from './login';
import { objToEmbed } from '../shared/helpers';
import { getLogger } from 'log4js'

const logger = getLogger('Point Counter');


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
  const guild = new Guild(client, {
    id: guildID
  });
  const channel = new TextChannel(guild, {
    id: channelID
  });

  const guildScores = scores.find((guildScore) => guildScore.guildID === guildID).memberScores;
  
  return Promise.all(Object.keys(guildScores).map((userID) => {
    return new GuildMember(client, {
      user: {
        id: userID
      }
    }, guild).fetch().catch(() => {
      delete guildScores[userID];
      channel.send('Errored, please try again!');
      return Promise.reject(`Invalid user id ${userID}`);
    })
  })).then((members: Array<GuildMember>) => {
    return channel.send({
      title: 'Scores',
      embed: {
        fields: objToEmbed(guildScores).map((element, i) => {
          const user = members[i];
          return {
            name: user.nickname || user.displayName || user.user.username,
            value: element.value
          };
        }).sort((a, b) => {
          return Number(b.value) - Number(a.value);
        }).map((e) => {
          return {
            ...e,
            value: e.value + ' points'
          }
        })
      }
    })
  }).then((msg) => {
    config.setGuild(guildID, 'hideAndSeekMsgID', msg.id);
    msg.pin();

    if (currentMsgID) {
      const msg = new Message(client, {
        id: currentMsgID
      }, channel);
      msg.delete();
    } 
  }).catch((err) => {
    logger.error(err);
  })
}