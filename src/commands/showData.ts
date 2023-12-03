import { ApplyOptions } from "@sapphire/decorators";
import { Command } from "@sapphire/framework";
import { decodeFromEmbedURL } from "../util/embedDataURL";
import { ApplicationCommandType } from "discord.js";

export type FlagGame = {
  countryCode: string;
  countryNames: string[];
};

@ApplyOptions<Command.Options>({
  name: "showdata",
  description: "show the encoded data of an embed",
  enabled: true,
})
export class FlagCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerContextMenuCommand(builder =>
      builder.setName(this.name).setType(ApplicationCommandType.Message)
    );
  }

  public override async contextMenuRun(interaction: Command.ContextMenuCommandInteraction) {
    if (!interaction.isMessageContextMenuCommand()) return;

    const embed = interaction.targetMessage.embeds[0];

    if (!embed) {
      interaction.reply({
        content: `No embed found, this command only works embeds sent by ${interaction.client.user}`,
        ephemeral: true,
      });
      return;
    }

    const encodedData = decodeFromEmbedURL(embed);

    if (!encodedData) {
      interaction.reply({
        content:
          "No data found in embed" +
          (interaction.targetMessage.author.id !== interaction.client.user.id
            ? ` (this command only works on embeds sent by ${interaction.client.user})`
            : ""),
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({
      content: `Encoded data: \`\`\`json\n${JSON.stringify(encodedData, null, 2)}\n\`\`\``,
      ephemeral: true,
    });
  }
}
