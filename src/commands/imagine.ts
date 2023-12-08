import { ApplyOptions } from "@sapphire/decorators";
import { ChatInputCommand, Command } from "@sapphire/framework";
import { ChatInputCommandInteraction } from "discord.js";
import { SubmitPromptModal } from "../interaction-handlers/submitPromptModal";

@ApplyOptions<Command.Options>({
  name: "imagine",
  description: "create a AI generated image",
  enabled: true,
})
export class ImagineCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(builder =>
      builder.setDMPermission(false).setName(this.name).setDescription(this.description)
    );
  }

  public override async chatInputRun(
    interaction: ChatInputCommandInteraction,
    _context: ChatInputCommand.RunContext
  ) {
    await interaction.showModal(SubmitPromptModal.createModal());
  }
}
