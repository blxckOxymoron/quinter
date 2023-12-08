import { ApplyOptions } from "@sapphire/decorators";
import { ChatInputCommand, Command } from "@sapphire/framework";
import { ChatInputCommandInteraction } from "discord.js";
import { SubmitPromptModalHandler } from "../interaction-handlers/submitPromptModal";
import { isStableDiffusionSetUp } from "../util/stableDiffusion";

@ApplyOptions<Command.Options>({
  name: "imagine",
  description: "create a AI generated image",
  enabled: true,
})
export class ImagineCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(builder =>
      builder.setName(this.name).setDescription(this.description)
    );
  }

  public override async chatInputRun(
    interaction: ChatInputCommandInteraction,
    _context: ChatInputCommand.RunContext
  ) {
    if (!isStableDiffusionSetUp) {
      await interaction.reply({
        content: "Stable Diffusion is not set up in this environment, please try again later",
        ephemeral: true,
      });

      return;
    }

    await interaction.showModal(SubmitPromptModalHandler.createModal());
  }
}
