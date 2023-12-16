import { ApplyOptions } from "@sapphire/decorators";
import { InteractionHandler, InteractionHandlerTypes } from "@sapphire/framework";
import {
  ModalBuilder,
  type ButtonInteraction,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ModalActionRowComponentBuilder,
  EmbedBuilder,
  User,
  BaseMessageOptions,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { twemojiUrl } from "../util/twemoji";
import { QuinterColors } from "../util/colors";
import { decodeFromEmbedURL, encodeInURL } from "../util/encodeInURL";
import { RatingCommand } from "../commands/rating";

export type Rating = {
  review: string;
  rating: number;
  userId: string;
};

@ApplyOptions<InteractionHandler.Options>({
  interactionHandlerType: InteractionHandlerTypes.Button,
})
export class AddRatingButtonHandler extends InteractionHandler {
  public override parse(interaction: ButtonInteraction) {
    return interaction.customId === "add_rating" ? this.some() : this.none();
  }

  static createModal() {
    const reviewInput = new TextInputBuilder()
      .setCustomId("rating_reveiw")
      .setLabel("Write a review")
      .setPlaceholder("# Pretty cool project\nI enjoyed it a lot")
      .setStyle(TextInputStyle.Paragraph)
      .setMaxLength(200);

    const ratingInput = new TextInputBuilder()
      .setCustomId("rating")
      .setLabel("Rate the project (0-5)")
      .setPlaceholder("4")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(3);

    const modal = new ModalBuilder()
      .setTitle("Add Rating")
      .setCustomId("add_rating_modal")
      .addComponents(
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(reviewInput),
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(ratingInput)
      );

    return modal;
  }

  static createRatingResponse(author: User, r: Rating) {
    const embed = new EmbedBuilder()
      .setAuthor({
        name: "Rating",
        iconURL: twemojiUrl("⭐"),
      })
      .setDescription(`### ${author}'s review:\n${r.review}\n_ _`)
      .addFields([
        {
          name: "Author",
          value: author.toString(),
          inline: true,
        },
        {
          name: "Rating",
          value: r.rating.toFixed(1),
          inline: true,
        },
      ])
      .setColor(QuinterColors.Green)
      .setImage(
        `https://ratingstars.azurewebsites.net/stars?space=10&count=5&scale=0.3&rate=${r.rating}`
      )
      .setTimestamp()
      .setURL(encodeInURL<Rating>(r));

    const deleteRatingButton = new ButtonBuilder()
      .setCustomId("delete_rating")
      .setLabel("Delete Rating")
      .setStyle(ButtonStyle.Danger);

    return {
      embeds: [embed],
      components: [new ActionRowBuilder<ButtonBuilder>().addComponents(deleteRatingButton)],
    } satisfies BaseMessageOptions;
  }

  public async run(interaction: ButtonInteraction) {
    const thread = interaction.message.thread;
    if (!thread) throw new Error("Button on message without thread");

    const threadMessages = await thread.messages.fetch();
    const preveousVote = threadMessages.find(msg => {
      if (!msg.author.bot) return false;

      const embed = msg.embeds[0];
      if (!embed) return false;

      const rating = decodeFromEmbedURL<Rating>(embed);
      if (!rating) return false;

      return rating.userId === interaction.user.id;
    });

    if (preveousVote) {
      await interaction.reply({
        content: `You have already voted: (${preveousVote.url})`,
        ephemeral: true,
      });
      return;
    }

    await interaction.showModal(AddRatingButtonHandler.createModal());

    const modalInteraction = await interaction
      .awaitModalSubmit({
        time: 1000 * 60 * 5,
      })
      .catch(e => void e);

    if (!modalInteraction) return;

    const ratingInput = modalInteraction.fields.getTextInputValue("rating").replaceAll(",", ".");
    const ratingNumberValue = parseFloat(ratingInput);

    if (!ratingInput.match(/^\d(\.\d?)?$/) || ratingNumberValue < 0 || ratingNumberValue > 5) {
      await modalInteraction.reply({
        content: "Invalid rating, only ratings between 0 and 5 are allowed",
        ephemeral: true,
      });
      return;
    }

    // valid rating

    const roundedRating = Math.round(ratingNumberValue * 2) / 2;

    const rating: Rating = {
      rating: roundedRating,
      userId: interaction.user.id,
      review: modalInteraction.fields.getTextInputValue("rating_reveiw"),
    };

    const reviewResponse = AddRatingButtonHandler.createRatingResponse(interaction.user, rating);

    const reviewMessage = await thread.send(reviewResponse);

    const starterMessage = await thread.fetchStarterMessage();
    if (!starterMessage) throw Error("recived thread without starter message");

    const starterEmbed = starterMessage.embeds[0];
    if (!starterEmbed) throw Error("recived thread without starter embed");

    const newEmbed = RatingCommand.createUpdatedEmbed(starterEmbed, rating);

    await thread.fetchStarterMessage().then(msg => msg?.edit({ embeds: [newEmbed] }));

    await modalInteraction.reply({
      content: `Thank you for your rating!\nIt has been added to the thread (${reviewMessage.url})`,
      ephemeral: true,
    });
  }
}
