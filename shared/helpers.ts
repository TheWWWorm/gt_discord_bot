import Discord, { EmbedFieldData } from "discord.js";

export function objToEmbed(obj): Array<EmbedFieldData> {
  return Object.keys(obj).map((key) => {
    const embed: EmbedFieldData = {
      name: key,
      value: obj[key] || 'N/A'
    }
    return embed
  });
}

// Function for creating rng based calculation functions
export function getRngCalculator(chance: number, name = 'white box', action = 'pulls') {
  return (msg: Discord.Message, rolls) => {
    rolls = Math.floor(Number(rolls));
    if (!rolls || rolls < 1) {
      return msg.reply(`I need a valid number of ${action}!`);
    }
    const atLeast1Rng = (1 - ((100 - chance) / 100) ** rolls) * 100;
    msg.reply(`Chance to get at least 1 ${name} in ${rolls} ${action} is ${atLeast1Rng.toFixed(2)}%`);
  }
}

export function randomNumber(min: number , max: number){
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}