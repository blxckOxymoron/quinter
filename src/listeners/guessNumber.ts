import { ApplyOptions } from "@sapphire/decorators";
import { Listener } from "@sapphire/framework";
import { EmbedBuilder, Events, Message, User } from "discord.js";
import { decodeFromEmbedURL } from "../util/encodeInURL";
import { QuinterColors } from "../util/colors";
import { twemojiUrl } from "../util/twemoji";
import { NumberGameCommand, GuessTheNumberGame } from "../commands/numbergame";

@ApplyOptions<Listener.Options>({
  event: Events.MessageCreate,
})
export class GuessTheNumberListener extends Listener<Events.MessageCreate> {
  static createCorrectGuessEmbed(game: GuessTheNumberGame, user: User) {
    return new EmbedBuilder()
      .setColor(QuinterColors.Green)
      .setAuthor({
        name: "Guess the Number",
        iconURL: twemojiUrl("🎲"),
      })
      .setDescription(
        `## ${user} guessed correctly!\n ## The correct number was ${game.correctNumber}\n\n A new number has been picked, type your guess in the thread!`
      )
      .setTimestamp();
  }

  override async run(message: Message) {
    if (message.author.bot) return;
    if (!message.channel.isThread()) return;

    const starterMessage = await message.channel.fetchStarterMessage();
    if (!starterMessage) return;

    const embed = starterMessage.embeds[0];
    if (!embed) return;

    const decodedData = decodeFromEmbedURL<any>(embed);
    if (
      !decodedData ||
      !("max" in decodedData && "showHigherLower" in decodedData && "correctNumber" in decodedData)
    )
      return;

    const game = decodedData as GuessTheNumberGame;

    const guess = parseInt(message.content.toLowerCase());
    if (isNaN(guess)) {
      await message.react("❓");
      return;
    }

    if (guess !== game.correctNumber) {
      if (game.showHigherLower) {
        await message.react(guess > game.correctNumber ? "⬇️" : "⬆️");
      } else {
        await message.react("❌");
      }
      return;
    }

    await message.react("✅");

    await message.channel.send({
      embeds: [GuessTheNumberListener.createCorrectGuessEmbed(game, message.author)],
    });

    const overviewEmbed = NumberGameCommand.createGameOverviewEmbed(
      NumberGameCommand.getNewNumber(game)
    );

    await starterMessage.edit({
      embeds: [overviewEmbed],
    });

    await message.channel.send({
      embeds: [overviewEmbed],
    });
  }
}
