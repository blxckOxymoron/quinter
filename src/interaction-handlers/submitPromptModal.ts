import { ApplyOptions } from "@sapphire/decorators";
import { InteractionHandler, InteractionHandlerTypes } from "@sapphire/framework";
import {
  ModalSubmitInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ModalActionRowComponentBuilder,
} from "discord.js";
import { handleNewUserPrompt, isStableDiffusionSetUp } from "../util/stableDiffusion";

@ApplyOptions<InteractionHandler.Options>({
  interactionHandlerType: InteractionHandlerTypes.ModalSubmit,
})
export class SubmitPromptModalHandler extends InteractionHandler {
  public override parse(interaction: ModalSubmitInteraction) {
    return interaction.customId === "sd_prompt_modal" ? this.some() : this.none();
  }

  static createModal(value: string | undefined = undefined) {
    const promptInputComponent = new TextInputBuilder()
      .setCustomId("prompt")
      .setLabel("Prompt")
      .setPlaceholder("Enter a prompt")
      .setMaxLength(100)
      .setStyle(TextInputStyle.Short);

    if (value) promptInputComponent.setValue(value);

    return new ModalBuilder()
      .setTitle("Submit a prompt")
      .setCustomId("sd_prompt_modal")
      .addComponents(
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(promptInputComponent)
      );
  }

  public async run(interaction: ModalSubmitInteraction) {
    const prompt = interaction.fields.getTextInputValue("prompt");

    if (!isStableDiffusionSetUp) {
      await interaction.reply({
        content: "Stable Diffusion is not set up in this environment, please try again later",
        ephemeral: true,
      });
      return;
    }

    await handleNewUserPrompt(interaction, prompt);
  }
}
