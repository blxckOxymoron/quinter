import { ApplyOptions } from "@sapphire/decorators";
import { ChatInputCommand, Command } from "@sapphire/framework";
import {
  APIApplicationCommandOptionChoice,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { Meme, getMeme } from "../util/memeAPI";
import { twemojiUrl } from "../util/twemoji";
import { QuinterColors } from "../util/colors";
import { encodeInURL } from "../util/encodeInURL";

export type MemeInfo = Omit<Meme, "preview" | "nsfw">;

const memeCategories = {
  english: ["memes", "dankmemes", "wholesomememes", "me_irl"],
  programmer: ["ProgrammerHumor", "programmingmemes"],
  german: ["ich_iel"],
  minecraft: ["MinecraftMemes", "PhoenixSC"],
};

const memeChoices: APIApplicationCommandOptionChoice<string>[] = Object.entries(memeCategories).map(
  ([key, value]) => ({
    name: `${key} memes (${value.map(s => `r/${s}`).join(", ")})`,
    value: key,
  })
);

@ApplyOptions<Command.Options>({
  name: "meme",
  description: "Get a random meme from reddit",
  enabled: true,
})
export class MemeCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(builder =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption(opt =>
          opt
            .setName("category")
            .setDescription("Select a category of memes")
            .setRequired(false)
            .setChoices(...memeChoices)
        )
    );
  }

  static createMemeEmbed(meme: Meme) {
    return new EmbedBuilder()
      .setColor(QuinterColors.Blue)
      .setAuthor({
        name: "Meme",
        iconURL: twemojiUrl("😂"),
      })
      .setDescription(
        `# ${meme.title} \n\n**by [${meme.author}](${meme.postLink})** (${meme.ups} ⬆️)`
      )
      .setImage(meme.url)
      .setTimestamp()
      .setFooter({
        text: `r/${meme.subreddit}`,
        iconURL: "https://www.redditstatic.com/desktop2x/img/favicon/favicon-32x32.png",
      })
      .setURL(
        encodeInURL<MemeInfo>({
          author: meme.author,
          subreddit: meme.subreddit,
          title: meme.title,
          postLink: meme.postLink,
          spoiler: meme.spoiler,
          ups: meme.ups,
          url: meme.url,
        })
      );
  }

  public override async chatInputRun(
    interaction: ChatInputCommandInteraction,
    _context: ChatInputCommand.RunContext
  ) {
    const category = interaction.options.getString("category") ?? "english";
    const subreddits = memeCategories[category];
    const subreddit = subreddits[Math.floor(Math.random() * subreddits.length)];

    const res = await getMeme(subreddit);
    if (!res) {
      await interaction.reply("Could not get meme 😭");
      return;
    }

    await interaction.reply({
      embeds: [MemeCommand.createMemeEmbed(res)],
      fetchReply: true,
    });
  }
}
