import { ApplyOptions } from "@sapphire/decorators";
import { InteractionHandler, InteractionHandlerTypes } from "@sapphire/framework";
import { type ButtonInteraction } from "discord.js";
import { decodeFromEmbedURL } from "../util/encodeInURL";
import { AvatarInfo } from "../commands/avatar";
import { isStableDiffusionSetUp } from "../util/stableDiffusion";
import { SubmitPromptModalHandler } from "./submitPromptModal";

@ApplyOptions<InteractionHandler.Options>({
  interactionHandlerType: InteractionHandlerTypes.Button,
})
export class AvatarAIButtonHandler extends InteractionHandler {
  public override parse(interaction: ButtonInteraction) {
    return interaction.customId === "avatar_ai" ? this.some() : this.none();
  }

  public async run(interaction: ButtonInteraction) {
    if (interaction.message.author.id !== this.container.client.user?.id) return;

    const avatarEmbed = interaction.message.embeds[0];
    if (!avatarEmbed) return;

    const avatarData = decodeFromEmbedURL<any>(avatarEmbed);
    if (!avatarData || !("userId" in avatarData)) return;

    const avatarInfo = avatarData as AvatarInfo;
    const user = await this.container.client.users.fetch(avatarInfo.userId);

    if (!isStableDiffusionSetUp) {
      await interaction.reply({
        content: "Stable Diffusion is not set up in this environment, please try again later",
        ephemeral: true,
      });
      return;
    }

    await interaction.showModal(
      SubmitPromptModalHandler.createModal(`@${user.tag}'s discord avatar`)
    );
  }
}
