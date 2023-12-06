import { ApplyOptions } from "@sapphire/decorators";
import { ChatInputCommand, Command } from "@sapphire/framework";
import {
  ActionRowBuilder,
  AttachmentBuilder,
  BaseMessageOptions,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { searchForImage } from "../util/imageAPI";
import { twemojiUrl } from "../util/twemoji";
import { QuinterColors } from "../util/colors";
import { PhotosWithTotalResults } from "pexels";
import { encodeInURL } from "../util/encodeInURL";

export type ImageInfo = Pick<PhotosWithTotalResults, "per_page" | "page" | "total_results"> & {
  query: string;
  page_count: number;
};

@ApplyOptions<Command.Options>({
  name: "images",
  description: "show some images from a query",
  enabled: true,
})
export class ImageCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(builder =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption(option =>
          option.setName("query").setDescription("the query to search for").setRequired(true)
        )
    );
  }

  static createMessageFromImages(images: PhotosWithTotalResults, query: string) {
    const attachemnts = images.photos.map(photo =>
      new AttachmentBuilder(photo.src.medium).setDescription(
        photo.alt + ` - by ${photo.photographer} on Pexels`
      )
    );

    const imageStartNumber = images.per_page * (images.page - 1) + 1;
    const pageCount = Math.ceil(images.total_results / images.per_page);

    const embed = new EmbedBuilder()
      .setColor(QuinterColors.Blue)
      .setAuthor({
        name: "Images",
        iconURL: twemojiUrl("📷"),
      })
      .setDescription(`# Images for _${query}_\npage ${images.page} of ${pageCount}`)
      .setTimestamp()
      .setFooter({
        text: "Powered by Pexels",
        iconURL: "https://images.pexels.com/lib/api/pexels-white.png",
      })
      .addFields(
        images.photos.map((photo, i) => ({
          name: `Image ${imageStartNumber + i} by ${photo.photographer}`,
          value: `[image ↗](${photo.url}) [author ↗](${photo.photographer_url})`,
          inline: true,
        }))
      )
      .setURL(
        encodeInURL<ImageInfo>({
          total_results: images.total_results,
          page: images.page,
          per_page: images.per_page,
          query,
          page_count: pageCount,
        })
      );

    const nextPageButton = new ButtonBuilder()
      .setCustomId("images_next_page")
      .setLabel("Next Page")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("➡️")
      .setDisabled(images.page >= pageCount);

    const previousPageButton = new ButtonBuilder()
      .setCustomId("images_previous_page")
      .setLabel("Previous Page")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("⬅️")
      .setDisabled(images.page === 1);

    return {
      embeds: [embed],
      files: attachemnts,
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents([previousPageButton, nextPageButton]),
      ],
    } satisfies BaseMessageOptions;
  }

  public override async chatInputRun(
    interaction: ChatInputCommandInteraction,
    _context: ChatInputCommand.RunContext
  ) {
    const query = interaction.options.getString("query", true);

    const images = await searchForImage(query);

    if (images.total_results === 0) {
      await interaction.reply({
        content: "No images found",
        ephemeral: true,
      });
      return;
    }

    interaction.reply(ImageCommand.createMessageFromImages(images, query));
  }
}
