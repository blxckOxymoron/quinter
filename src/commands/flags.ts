import { ApplyOptions } from "@sapphire/decorators";
import { ChatInputCommand, Command } from "@sapphire/framework";
import {
  ChannelType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ThreadAutoArchiveDuration,
} from "discord.js";
import { twemojiUrl } from "../util/twemoji";
import { QuinterColors } from "../util/colors";
import { encodeInURL } from "../util/embedDataURL";
import { getRandomCountry } from "../util/countryCodes";

export type FlagGame = {
  countryCode: string;
  countryNames: string[];
};

@ApplyOptions<Command.Options>({
  name: "createflaggame",
  description: "create a new game of guessing flags",
  enabled: true,
  runIn: ChannelType.GuildText,
})
export class FlagCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(builder =>
      builder.setDMPermission(false).setName(this.name).setDescription(this.description)
    );
  }

  static createGameOverviewEmbed(game: FlagGame) {
    return new EmbedBuilder()
      .setDescription(
        `# What country is this? \n# :flag_${game.countryCode.toLowerCase()}:\n\nGuess the flag of the country by typing in the thread`
      )
      .setColor(QuinterColors.Blue)
      .setAuthor({
        name: "Flag Game",
        iconURL: twemojiUrl("🌍"),
      })
      .setTimestamp()
      .setURL(encodeInURL(game));
  }

  public override async chatInputRun(
    interaction: ChatInputCommandInteraction,
    _context: ChatInputCommand.RunContext
  ) {
    const ratingOverview = await interaction.reply({
      embeds: [FlagCommand.createGameOverviewEmbed(getRandomCountry())],
      fetchReply: true,
    });

    await ratingOverview.startThread({
      name: "Guess the Flag",
      autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
      rateLimitPerUser: 2,
    });
  }
}
