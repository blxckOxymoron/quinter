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
  User,
} from "discord.js";
import { twemojiUrl } from "../util/twemoji";
import { QuinterColors } from "../util/colors";
import { encodeInURL } from "../util/encodeInURL";
import { isStableDiffusionSetUp } from "../util/stableDiffusion";

export type AvatarInfo = {
  userId: string;
};

@ApplyOptions<Command.Options>({
  name: "avatar",
  description: "get avatar information of a user",
  enabled: true,
})
export class AvatarCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(builder =>
      builder
        .setDMPermission(false)
        .setName(this.name)
        .setDescription(this.description)
        .addUserOption(opt =>
          opt.setName("user").setDescription("The user to get the avatar of").setRequired(false)
        )
    );
  }

  static createAvatarResponse(user: User) {
    const pngLink = new ButtonBuilder()
      .setStyle(ButtonStyle.Link)
      .setURL(user.displayAvatarURL({ extension: "png", size: 4096 }))
      .setLabel("PNG");
    const jpgLink = new ButtonBuilder()
      .setStyle(ButtonStyle.Link)
      .setURL(user.displayAvatarURL({ extension: "jpg", size: 4096 }))
      .setLabel("JPG");
    const webpLink = new ButtonBuilder()
      .setStyle(ButtonStyle.Link)
      .setURL(user.displayAvatarURL({ extension: "webp", size: 4096 }))
      .setLabel("WEBP");

    const aiButton = new ButtonBuilder()
      .setStyle(ButtonStyle.Secondary)
      .setCustomId("avatar_ai")
      .setLabel("Generate AI Profile Picture")
      .setEmoji("✨")
      .setDisabled(!isStableDiffusionSetUp);

    const embed = new EmbedBuilder()
      .setAuthor({
        name: "Avatar",
        iconURL: twemojiUrl("🗿"),
      })
      .setDescription(`# ${user}'s avatar`)
      .setColor(QuinterColors.Blue)
      .setTimestamp()
      .setURL(
        encodeInURL<AvatarInfo>({
          userId: user.id,
        })
      );
    return {
      embeds: [embed],
      files: [new AttachmentBuilder(user.displayAvatarURL({ size: 2048 }))],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(pngLink, jpgLink, webpLink),
        new ActionRowBuilder<ButtonBuilder>().addComponents(aiButton),
      ],
    } satisfies BaseMessageOptions;
  }

  public override async chatInputRun(
    interaction: ChatInputCommandInteraction,
    _context: ChatInputCommand.RunContext
  ) {
    const user = interaction.options.getUser("user") ?? interaction.user;

    await interaction.reply(AvatarCommand.createAvatarResponse(user));
  }
}
