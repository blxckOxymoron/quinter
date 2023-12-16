import { ApplyOptions } from "@sapphire/decorators";
import { InteractionHandler, InteractionHandlerTypes } from "@sapphire/framework";
import { type ButtonInteraction } from "discord.js";
import { decodeFromEmbedURL } from "../util/encodeInURL";

@ApplyOptions<InteractionHandler.Options>({
  interactionHandlerType: InteractionHandlerTypes.Button,
})
export class AddRatingButtonHandler extends InteractionHandler {
  public override parse(interaction: ButtonInteraction) {
    return interaction.customId === "delete_rating" ? this.some() : this.none();
  }

  public async run(interaction: ButtonInteraction) {
    if (interaction.message.author.id !== this.container.client.user?.id) return;

    const ratingEmbed = interaction.message.embeds[0];
    if (!ratingEmbed) return;

    const ratingData = decodeFromEmbedURL<any>(ratingEmbed);
    if (
      !ratingData ||
      !("review" in ratingData && "rating" in ratingData && "userId" in ratingData)
    )
      return;

    // confirmed that the deleted embed is a rating embed

    if (interaction.user.id !== ratingData.userId) {
      await interaction.reply({
        content: "You can only delete your own ratings!",
        ephemeral: true,
      });
      return;
    }

    await interaction.message.delete();

    await interaction.reply({
      content: "Rating deleted! You can add a new one now.",
      ephemeral: true,
    });
  }
}
