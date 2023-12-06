import { ApplyOptions } from "@sapphire/decorators";
import { InteractionHandler, InteractionHandlerTypes } from "@sapphire/framework";
import { type ButtonInteraction } from "discord.js";
import { decodeFromEmbedURL } from "../util/encodeInURL";
import { ImageCommand, ImageInfo } from "../commands/image";
import { searchForImage } from "../util/imageAPI";

@ApplyOptions<InteractionHandler.Options>({
  interactionHandlerType: InteractionHandlerTypes.Button,
})
export class AddReminderButtonHandler extends InteractionHandler {
  public override parse(interaction: ButtonInteraction) {
    return ["images_next_page", "image_previous_page"].includes(interaction.customId)
      ? this.some()
      : this.none();
  }

  public async run(interaction: ButtonInteraction) {
    const embed = interaction.message.embeds[0];
    if (!embed) return;

    const imageInfo = decodeFromEmbedURL<ImageInfo>(embed);
    if (!imageInfo) return;

    let nextPage = imageInfo.page;

    // prevent over pagination
    switch (interaction.customId) {
      case "images_next_page": {
        if (imageInfo.page >= imageInfo.page_count) {
          await interaction.deferUpdate();
          return;
        }
        nextPage++;
        break;
      }
      case "images_previous_page": {
        if (imageInfo.page === 1) {
          await interaction.deferUpdate();
          return;
        }
        nextPage--;
        break;
      }
    }

    const nextImages = await searchForImage(imageInfo.query, nextPage);

    if (nextImages.total_results === 0) {
      await interaction.reply({
        content: "No images found",
        ephemeral: true,
      });
      return;
    }

    const newEmbed = ImageCommand.createMessageFromImages(nextImages, imageInfo.query);

    await interaction.update(newEmbed);
  }
}
