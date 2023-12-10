import { ApplyOptions } from "@sapphire/decorators";
import { Listener } from "@sapphire/framework";
import { EmbedBuilder, Events, Message, ThreadChannel, User } from "discord.js";
import { decodeFromEmbedURL } from "../util/encodeInURL";
import { FlagGameCommand, FlagGame } from "../commands/flaggame";
import { QuinterColors } from "../util/colors";
import { twemojiUrl } from "../util/twemoji";
import { getRandomCountry } from "../util/countryCodes";

@ApplyOptions<Listener.Options>({
  event: Events.MessageCreate,
})
export class GuessCountryListener extends Listener<Events.MessageCreate> {
  static createCorrectGuessEmbed(
    game: FlagGame,
    guess: string,
    user: User,
    channel: ThreadChannel
  ) {
    return new EmbedBuilder()
      .setColor(QuinterColors.Green)
      .setAuthor({
        name: "Flag Game",
        iconURL: twemojiUrl("🌍"),
      })
      .setDescription(
        `## ${user} guessed correctly!\n ## :flag_${game.countryCode.toLowerCase()}: ${guess}\n\nThe next flag is shown in the thread message`
      )
      .setTimestamp()
      .setFooter({
        text: `${channel.messageCount ?? 2 - 1} total guesses`,
      });
  }

  override async run(message: Message) {
    if (message.author.bot) return;
    if (!message.channel.isThread()) return;

    const starterMessage = await message.channel.fetchStarterMessage();
    if (!starterMessage) return;

    const embed = starterMessage.embeds[0];
    if (!embed) return;

    const decodedData = decodeFromEmbedURL<any>(embed);
    if (!decodedData || !("countryCode" in decodedData && "countryNames" in decodedData)) return;

    const game = decodedData as FlagGame;

    const guess = message.content.toLowerCase();
    const correctName = game.countryNames.find(name => name.toLowerCase() === guess);

    if (!correctName) {
      await message.react("❌");
      return;
    }

    await message.channel.bulkDelete(50);

    await message.channel.send({
      embeds: [
        GuessCountryListener.createCorrectGuessEmbed(
          game,
          correctName,
          message.author,
          message.channel
        ),
      ],
    });

    await starterMessage.edit({
      embeds: [FlagGameCommand.createGameOverviewEmbed(getRandomCountry())],
    });
  }
}
