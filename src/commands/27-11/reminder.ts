import { ApplyOptions } from "@sapphire/decorators";
import { ChatInputCommand, Command } from "@sapphire/framework";
import {
  ActionRowBuilder,
  AutocompleteInteraction,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  ComponentType,
  EmbedBuilder,
  TimestampStyles,
  User,
  time,
} from "discord.js";
import { getDurationSuggestions, parseDuration } from "../../util/durationInput";
import { twemojiUrl } from "../../util/twemoji";
import { QuinterColors } from "../../util/colors";

@ApplyOptions<Command.Options>({
  name: "reminder",
  description: "Get remided with a note in DM or chat",
  enabled: true,
})
export class NoteCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(builder =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption(opt =>
          opt.setName("note").setDescription("The note to be reminded of").setRequired(true)
        )
        .addStringOption(opt =>
          opt
            .setName("timer_duration")
            .setDescription("The duration untill you are remided")
            .setAutocomplete(true)
            .setRequired(true)
        )
        .addBooleanOption(opt =>
          opt.setName("dm").setDescription("Send the note in DM").setRequired(false)
        )
    );
  }

  embedWithNote(note: string, author?: User) {
    return new EmbedBuilder()
      .setTimestamp()
      .setAuthor({
        name: "Reminder",
        iconURL: twemojiUrl("⏰"),
      })
      .setColor(QuinterColors.Blue)
      .setDescription("#  " + note + (author ? `\n\n_Reminder set by:_ ${author}` : ""));
  }

  public override async chatInputRun(
    interaction: ChatInputCommandInteraction,
    _context: ChatInputCommand.RunContext
  ) {
    const note = interaction.options.getString("note");
    if (note === null) return;

    const duration = interaction.options.getString("timer_duration");
    if (duration === null) return;

    const durationInSeconds = parseDuration(duration);

    if (durationInSeconds <= 0) {
      await interaction.reply({
        content: "The duration must be greater than 0",
        ephemeral: true,
      });
      return;
    }

    const dm = interaction.options.getBoolean("dm");

    const cancelButton = new ButtonBuilder()
      .setCustomId("cancel")
      .setLabel("Cancel")
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(cancelButton);

    const successReply = await interaction.reply({
      content: `I will remind you ${time(
        Math.ceil(Date.now() / 1000) + durationInSeconds,
        TimestampStyles.RelativeTime
      )} with the note: ${note}`,
      ephemeral: true,
      components: [row],
    });

    if (dm) {
      await interaction.followUp({
        content: "If you want the reminder to be sent via DM, make sure you have them enabled!",
        ephemeral: true,
      });
    }

    const sendMessageTimeout = setTimeout(async () => {
      if (dm === true || dm === null) {
        // should try to send in dms but send in channel if fails
        await interaction.user.send({ embeds: [this.embedWithNote(note)] }).catch(async () => {
          // could not send in dms
          const noteEmbed = this.embedWithNote(note, interaction.user);
          if (dm) noteEmbed.setFooter({ text: "The reminder could not be sent in DM" });

          await interaction.channel?.send({
            embeds: [noteEmbed],
            allowedMentions: { users: [interaction.user.id], roles: [] },
          });
        });
      } else if (dm === false) {
        // send in channel directly
        await interaction.channel?.send({
          embeds: [this.embedWithNote(note, interaction.user)],
          allowedMentions: { users: [interaction.user.id], roles: [] },
        });
      }
    }, durationInSeconds * 1000);

    await successReply
      .awaitMessageComponent<ComponentType.Button>({
        filter: interaction => interaction.customId === "cancel",
        componentType: ComponentType.Button,
        time: durationInSeconds * 1000,
      })
      .then(async interact => {
        clearTimeout(sendMessageTimeout);
        await interact.reply({
          content: "The reminder has been cancelled!",
          ephemeral: true,
        });
        await successReply.delete().catch();
      })
      .catch(async () => {
        await successReply.delete().catch();
      });
  }

  exampleDurations = ["20s", "1m 30s", "10m", "30m", "1h", "1h 30m"];

  public override async autocompleteRun(interaction: AutocompleteInteraction) {
    if (interaction.options.getFocused(true).name !== "timer_duration") return;

    const amount = interaction.options.getString("timer_duration");
    if (amount === null) return this.container.logger.info("amount is null");

    const suggestions = getDurationSuggestions(amount);

    return interaction.respond(
      suggestions.map(suggestion => ({ name: suggestion, value: suggestion }))
    );
  }
}
