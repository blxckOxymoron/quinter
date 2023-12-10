import { getAlpha2Codes, getName } from "i18n-iso-countries";
import { FlagGame } from "../commands/flaggame";
import { TextBasedChannel } from "discord.js";

const allowedLangs = ["de", "en"];

export function getRandomCountry(): FlagGame {
  const codes = Object.keys(getAlpha2Codes());
  const randomCountryCode = codes[Math.floor(Math.random() * codes.length)];
  if (!randomCountryCode) throw Error("no random country code found");

  const countryNames = allowedLangs
    .map(lang => getName(randomCountryCode, lang))
    .filter(Boolean) as string[];

  return {
    countryCode: randomCountryCode,
    countryNames,
  };
}

export function getAllCountryCodes(): FlagGame[] {
  return Object.keys(getAlpha2Codes()).map(key => {
    return {
      countryCode: key,
      countryNames: allowedLangs.map(lang => getName(key, lang)) as string[],
    };
  });
}

export async function sendAllCountryCodes(channel: TextBasedChannel) {
  const MAX_CHARS = 2000;

  let message = "";

  for (const game of getAllCountryCodes()) {
    const thisMessage = `## :flag_${game.countryCode.toLowerCase()}: ${game.countryNames.join(
      ", "
    )}\n`;
    if (message.length + thisMessage.length > MAX_CHARS) {
      await channel.send({
        content: message,
      });
      message = "";
    }
    message += thisMessage;
  }

  await channel.send({
    content: message,
  });
}
