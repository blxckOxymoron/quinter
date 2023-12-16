import { ApplyOptions } from "@sapphire/decorators";
import { Listener } from "@sapphire/framework";
import { Events, Message } from "discord.js";
import { decodeFromEmbedURL } from "../util/encodeInURL";
import { RatingCommand, RatingEvent } from "../commands/rating";
import { Rating } from "../interaction-handlers/addRatingButton";

@ApplyOptions<Listener.Options>({
  event: Events.MessageDelete,
})
export class GuessTheNumberListener extends Listener<Events.MessageDelete> {
  override async run(message: Message) {
    if (message.author.id !== this.container.client.user?.id) return;
    if (!message.channel.isThread()) return;

    const starterMessage = await message.channel.fetchStarterMessage();
    if (!starterMessage) return;

    const embed = starterMessage.embeds[0];
    if (!embed) return;

    const decodedData = decodeFromEmbedURL<any>(embed);
    if (
      !decodedData ||
      !(
        "title" in decodedData &&
        "description" in decodedData &&
        "totalRating" in decodedData &&
        "rating" in decodedData &&
        "votes" in decodedData
      )
    )
      return;

    const ratingEvent = decodedData as RatingEvent;

    const deletedRatingEmbed = message.embeds[0];
    if (!deletedRatingEmbed) return;

    const deletedData = decodeFromEmbedURL<any>(deletedRatingEmbed);
    if (
      !deletedData ||
      !("review" in deletedData && "rating" in deletedData && "userId" in deletedData)
    )
      return;

    const deletedRating = deletedData as Rating;

    await starterMessage.edit({
      embeds: [RatingCommand.createUpdatedEmbed(ratingEvent, deletedRating, true)],
    });
  }
}
