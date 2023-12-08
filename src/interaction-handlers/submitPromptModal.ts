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
import { handleNewUserPrompt } from "../util/stableDiffusion";

@ApplyOptions<InteractionHandler.Options>({
  interactionHandlerType: InteractionHandlerTypes.ModalSubmit,
})
export class SubmitPromptModalHandler extends InteractionHandler {
  public override parse(interaction: ModalSubmitInteraction) {
    return interaction.customId === "sd_prompt_modal" ? this.some() : this.none();
  }

  static createModal(placeholder: string = "Enter a prompt...") {
    const promptInputComponent = new TextInputBuilder()
      .setCustomId("prompt")
      .setLabel("Prompt")
      .setMaxLength(100)
      .setPlaceholder(placeholder)
      .setStyle(TextInputStyle.Paragraph);

    return new ModalBuilder()
      .setTitle("Submit a prompt")
      .setCustomId("sd_prompt_modal")
      .addComponents(
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(promptInputComponent)
      );
  }

  public async run(interaction: ModalSubmitInteraction) {
    const prompt = interaction.fields.getTextInputValue("prompt");

    await handleNewUserPrompt(interaction, prompt);
  }
}
