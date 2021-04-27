import Discord from 'discord.js';
import fs from 'fs';
import path from 'path';
import client from './login';

type Room = {
  guildId: string,
  channelId: string
}

const roomFileName = path.join(__dirname + '/rooms.json');

function syncRooms(obj) {
  fs.writeFile(roomFileName, JSON.stringify(obj), (err) => {
    if (err) {
      console.error('Errored while trying to update the coop rooms file', err.stack);
    }
  });
}

let rooms: Array<Room>;
try {
  rooms = JSON.parse(fs.readFileSync(roomFileName).toString());
} catch (e) {
  rooms = [];
  syncRooms(rooms);
}

const minutesUntilDeletion: number = Number(process.env.COOP_CHANNEL_MAX_INACTIVE_TIME);
const coopChannelDeleteIn = 1e3 * 60 * minutesUntilDeletion;
//const coopChannelDeleteIn = 1e3 * 5; // For quick testing

class RoomWatcher {

  public interval = 5 * 1e3;

  constructor(private rooms: Array<Room> = []) {
    rooms.forEach((room) => this.watch(room));
  }

  public watch(room: Room) {
    try {
      const guild = new Discord.Guild(client, {
        id: room.guildId
      });
      const channel = new Discord.TextChannel(guild, {
        id: room.channelId
      });
      const sheduleTheDeletion = (interval = this.interval) => {
        setTimeout(() => {
          channel.messages.fetch({
            limit: 1
          }).then((messages) => {
            const message = messages.last();
            const msgStamp = message?.createdTimestamp
            console.log('Comparing messages', Date.now(), msgStamp, message?.content);
            if (!msgStamp || Date.now() - msgStamp > coopChannelDeleteIn) {
              console.log('Deleting channel', channel.id)
              channel.delete()
              this.removeRoom(channel.id);
            } else {
              sheduleTheDeletion();
            }
          }).catch((err) => {
            console.log(`Message fetch failed, deleting room ${room.channelId}`, err.stack);
            this.removeRoom(room.channelId);
          })
        }, interval);
      };
      sheduleTheDeletion(coopChannelDeleteIn);
    } catch (err) {
      console.log(`Errored during coop room watcher init, deleting room ${room.channelId}`, err.stack);
      this.removeRoom(room.channelId);
    }
  }

  addRoom(room: Room) {
    this.rooms.push(room);
    this.watch(room);
    syncRooms(this.rooms);
  }

  removeRoom(id: string) {
    this.rooms = rooms.filter((room) => room.channelId !== id);
    syncRooms(this.rooms);
  }
}

const watcher = new RoomWatcher(rooms);

export default watcher;