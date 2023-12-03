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
import { Nullish } from "@sapphire/utilities";

export type GuessTheNumberGame = {
  max: number;
  showHigherLower: boolean;
  correctNumber: number;
};

@ApplyOptions<Command.Options>({
  name: "createguessthenumber",
  description: "create a new game of guessing the number",
  enabled: true,
  runIn: ChannelType.GuildText,
})
export class GuessTheNumberCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(builder =>
      builder
        .setDMPermission(false)
        .setName(this.name)
        .setDescription(this.description)
        .addNumberOption(opt =>
          opt.setName("max").setDescription("The maximum number to guess").setRequired(false)
        )
        .addBooleanOption(opt =>
          opt
            .setName("show_higher_lower")
            .setDescription("Show wehter the nuber is higher or lower than the guessed number")
            .setRequired(false)
        )
    );
  }

  static createGameOverviewEmbed(game: GuessTheNumberGame) {
    return new EmbedBuilder()
      .setDescription(
        `# Guess the Number between 0 and ${game.max}\n\nGuess a number by typing in the thread`
      )
      .setColor(QuinterColors.Blue)
      .setAuthor({
        name: "Guess the Number",
        iconURL: twemojiUrl("🎲"), // 🔢
      })
      .setTimestamp()
      .setURL(encodeInURL(game));
  }

  static getNewNumber(baseGame: {
    [K in keyof GuessTheNumberGame]?: GuessTheNumberGame[K] | Nullish;
  }): GuessTheNumberGame {
    const max = baseGame.max ?? 100;
    return {
      max,
      showHigherLower: baseGame.showHigherLower ?? true,
      correctNumber: Math.floor(Math.random() * max),
    };
  }

  public override async chatInputRun(
    interaction: ChatInputCommandInteraction,
    _context: ChatInputCommand.RunContext
  ) {
    const max = interaction.options.getNumber("max", false);
    const showHigherLower = interaction.options.getBoolean("show_higher_lower", false);

    const game = GuessTheNumberCommand.getNewNumber({ max, showHigherLower });

    const ratingOverview = await interaction.reply({
      embeds: [GuessTheNumberCommand.createGameOverviewEmbed(game)],
      fetchReply: true,
    });

    await ratingOverview.startThread({
      name: "Guess the Number",
      autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
      rateLimitPerUser: 2,
    });
  }
}
