import { ApplyOptions } from "@sapphire/decorators";
import { InteractionHandler, InteractionHandlerTypes } from "@sapphire/framework";
import { type ButtonInteraction } from "discord.js";
import { decodeFromEmbedURL } from "../util/encodeInURL";
import { ImageCommand, ImageInfo } from "../commands/image";
import { searchForImage } from "../util/imageAPI";
import { isStableDiffusionSetUp } from "../util/stableDiffusion";
import { SubmitPromptModalHandler } from "./submitPromptModal";

@ApplyOptions<InteractionHandler.Options>({
  interactionHandlerType: InteractionHandlerTypes.Button,
})
export class ImageMenuButtonsHandler extends InteractionHandler {
  public override parse(interaction: ButtonInteraction) {
    return ["images_next_page", "image_previous_page", "image_ai"].includes(interaction.customId)
      ? this.some()
      : this.none();
  }

  public async run(interaction: ButtonInteraction) {
    const embed = interaction.message.embeds[0];
    if (!embed) return;

    const imageInfo = decodeFromEmbedURL<ImageInfo>(embed);
    if (!imageInfo) return;

    if (interaction.customId === "image_ai") {
      if (!isStableDiffusionSetUp) {
        await interaction.reply({
          content: "Stable Diffusion is not set up in this environment, please try again later",
          ephemeral: true,
        });
        return;
      }

      await interaction.showModal(
        SubmitPromptModalHandler.createModal(`stock image of "${imageInfo.query}"`)
      );

      return;
    }

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

    const newEmbed = ImageCommand.createImageResponse(nextImages, imageInfo.query);

    await interaction.update(newEmbed);
  }
}
