import { ApplyOptions } from "@sapphire/decorators";
import { ChatInputCommand, Command } from "@sapphire/framework";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  ChatInputCommandInteraction,
  Embed,
  EmbedBuilder,
  ThreadAutoArchiveDuration,
} from "discord.js";
import { twemojiUrl } from "../util/twemoji";
import { QuinterColors } from "../util/colors";
import { decodeFromEmbedURL, encodeInURL } from "../util/embedDataURL";
import { Rating } from "../interaction-handlers/addReminderButton";

type RatingEvent = {
  title: string;
  description: string;
  rating: number;
  votes: number;
};

@ApplyOptions<Command.Options>({
  name: "createrating",
  description: "create a new item to add ratings to",
  enabled: true,
  runIn: ChannelType.GuildText,
})
export class RatingCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(builder =>
      builder
        .setDMPermission(false)
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption(opt =>
          opt.setName("title").setDescription("The title of the rated item").setRequired(true)
        )
        .addStringOption(opt =>
          opt
            .setName("description")
            .setDescription("The description of  the rated item")
            .setRequired(true)
        )
    );
  }

  static balancedRating(rating: number, votes: number) {
    return (rating * votes + 5) / (votes + 2);
  }

  static createUpdatedEmbed(embed: Embed, rating: Rating) {
    const ratingEvent = decodeFromEmbedURL<RatingEvent>(embed);
    if (!ratingEvent) throw Error("recived embed without rating event");

    ratingEvent.rating =
      (ratingEvent.rating * ratingEvent.votes + rating.rating) / (ratingEvent.votes + 1);
    ratingEvent.votes++;

    return RatingCommand.createRatingOverviewEmbed(ratingEvent);
  }

  static createRatingOverviewEmbed(e: RatingEvent) {
    return new EmbedBuilder()
      .setAuthor({
        name: "Rating",
        iconURL: twemojiUrl("⭐"),
      })
      .setColor(QuinterColors.Blue)
      .setDescription(`#   ${e.title}\n${e.description}\n_ _`)
      .addFields([
        {
          name: "Rating",
          value: `${e.rating.toFixed(2)} (${e.votes} votes)`,
          inline: true,
        },
        {
          name: "Balanced Rating\n(includes vote count)",
          value: `${RatingCommand.balancedRating(e.rating, e.votes).toFixed(2)}`,
          inline: true,
        },
      ])
      .setImage(
        `https://ratingstars.azurewebsites.net/stars?space=10&count=5&scale=0.4&rate=${e.rating}`
      )
      .setURL(encodeInURL(e));
  }

  public override async chatInputRun(
    interaction: ChatInputCommandInteraction,
    _context: ChatInputCommand.RunContext
  ) {
    const title = interaction.options.getString("title", true);
    const description = interaction.options.getString("description", true);

    const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("add_rating")
        .setLabel("Add Rating")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("⭐")
    );

    const ratingOverview = await interaction.reply({
      embeds: [
        RatingCommand.createRatingOverviewEmbed({
          title,
          description,
          rating: 0,
          votes: 0,
        }),
      ],
      components: [buttonRow],
      fetchReply: true,
    });

    await ratingOverview.startThread({
      name: "Ratings",
      autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
    });
  }
}
