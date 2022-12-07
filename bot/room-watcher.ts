import { Guild, TextChannel } from 'discord.js';
import client from './login';
import { getLogger } from 'log4js'
import { readDB, writeDB } from '../db/db_helper';
import config from '../config';

const logger = getLogger('Room watcher');

type Room = {
  guildId: string,
  channelId: string
}

const dbName = 'rooms';
let rooms: Array<Room> = readDB(dbName)

const minutesUntilDeletion: number = Number(config.get('coopMaxInaciveTime'));
const coopChannelDeleteIn = 1e3 * 60 * minutesUntilDeletion;
//const coopChannelDeleteIn = 1e3 * 5; // For quick testing

// Watches the created rooms, and deletes the after some time of inactivity
class RoomWatcher {
  // How often to check if room is active or not
  public interval = 5 * 1e3;

  constructor(private rooms: Array<Room> = []) {
    rooms.forEach((room) => this.watch(room));
  }

  // Watch the room for activity
  public watch(room: Room) {
    try {
      // Create a guild instance
      // @NOTE: guild is the same as server, just called differently in discord api
      const guild = new Guild(client, {
        id: room.guildId
      });
      // Create a co-op channel instance
      const channel = new TextChannel(guild, {
        id: room.channelId
      });
      // Create a watcher Fn to repeat
      const sheduleTheDeletion = (interval = this.interval) => {
        setTimeout(() => {
          // Gets the last message from the room
          channel.messages.fetch({
            limit: 1
          }).then((messages) => {
            const message = messages.last();
            const msgStamp = message?.createdTimestamp
            logger.info('Comparing messages', Date.now(), msgStamp, message?.content);
            // If no message were made, or message was a long enough time ago - delete the room
            if (!msgStamp || Date.now() - msgStamp > coopChannelDeleteIn) {
              logger.info('Deleting channel', channel.id);
              this.removeRoom(channel.id);
              channel.delete();
            // If the above check fails, shedule a new check in the future
            } else {
              sheduleTheDeletion();
            }
          }).catch((err) => {
            // If errored - room was most likely deleted
            logger.error(`Message fetch failed, deleting room ${room.channelId}`, err.stack);
            this.removeRoom(room.channelId);
          })
        }, interval);
      };
      // Init the watching
      sheduleTheDeletion(coopChannelDeleteIn);
    } catch (err) {
      logger.error(`Errored during coop room watcher init, deleting room ${room.channelId}`, err.stack);
      this.removeRoom(room.channelId);
    }
  }

  // Add new room to watch list/file
  addRoom(room: Room) {
    this.rooms.push(room);
    this.watch(room);
    writeDB(dbName, this.rooms);
  }

  // Add new room to watch list/file
  removeRoom(id: string) {
    this.rooms = this.rooms.filter((room) => room.channelId !== id);
    writeDB(dbName, this.rooms);
  }
}

// Init watcher with rooms that are read from local disk
const watcher = new RoomWatcher(rooms);

// @TODO: conider exposing the class, instead of class instance
export default watcher;