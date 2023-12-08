import { AttachmentBuilder, EmbedBuilder, Interaction, RepliableInteraction } from "discord.js";
import { exec as execCallback } from "child_process";
import path from "path";
import fs from "fs/promises";
import { promisify } from "util";
import { container } from "@sapphire/framework";
import { twemojiUrl } from "./twemoji";
import { QuinterColors } from "./colors";
import { encodeInURL } from "./encodeInURL";
const exec = promisify(execCallback);

export type Prompt = {
  interaction: RepliableInteraction;
  userId: string;
  prompt: string;
  requestedAt: number;
  enqueuedAt?: number;
};

export type PromptResult = Prompt & {
  enqueuedAt: number;
  resultImagePaths: string[];
  generatingStartedAt: number;
  finishedAt: number;
  hadError: boolean;
};

export type PromptInfo = Pick<
  PromptResult,
  "prompt" | "resultImagePaths" | "finishedAt" | "enqueuedAt" | "generatingStartedAt"
>;

export const isStableDiffusionSetUp = process.env.PATH_TO_FASTSDCPU !== undefined;

const promptQueue: Prompt[] = [];
const userPromptQueue = new Map<string, Prompt[]>();

let running = false;

export async function handleNewUserPrompt(interaction: RepliableInteraction, prompt: string) {
  const userId = interaction.user.id;

  const promptData: Prompt = {
    interaction,
    userId,
    prompt,
    requestedAt: Date.now(),
  };

  // initial reply will be edited later
  await interaction.reply({
    content: `Prompt **${prompt}** added to you personal queue. (current personal queue length: ${
      getUserQueue(userId).length
    })`,
  });

  getUserQueue(userId).push(promptData);

  await checkAndEnqueueNextForUser(userId);
}

async function checkAndEnqueueNextForUser(userId: string) {
  const hasPromptInQueue = promptQueue.some(p => p.userId === userId);
  if (hasPromptInQueue) return;

  const userQueue = getUserQueue(userId);
  const nextPrompt = userPromptQueue.get(userId)?.shift();

  if (userQueue.length === 0) userPromptQueue.delete(userId);

  if (!nextPrompt) return;

  nextPrompt.enqueuedAt = Date.now();
  promptQueue.push(nextPrompt);

  await nextPrompt.interaction
    .editReply({
      content: `Prompt **${nextPrompt.prompt}** added to the global queue. (current global queue length: ${promptQueue.length})`,
    })
    .catch(e => void e);

  if (!running) startGenerationLoop();
}

function getUserQueue(userId: string) {
  const queue = userPromptQueue.get(userId);
  if (!queue) {
    userPromptQueue.set(userId, []);
    return userPromptQueue.get(userId)!;
  }

  return queue;
}

async function startGenerationLoop() {
  running = true;

  while (promptQueue.length > 0) {
    const queuedPrompt = promptQueue.shift()!;

    const prompt: PromptResult = {
      enqueuedAt: 0,
      ...queuedPrompt,
      resultImagePaths: [],
      generatingStartedAt: 0,
      finishedAt: 0,
      hadError: false,
    };

    await prompt.interaction.editReply({
      content: `Started generating your image **${prompt.prompt}**...`,
    });

    container.logger.info(
      "generating image",
      prompt.prompt,
      "queue",
      promptQueue.length,
      "user queue",
      Array.from(userPromptQueue.values()).reduce((acc, val) => acc + val.length, 0)
    );

    prompt.generatingStartedAt = Date.now();

    await exec(
      `cd ${process.env.PATH_TO_FASTSDCPU} && source env/bin/activate && python3 src/app.py --use_openvino --prompt "$PROMPT"`,
      {
        timeout: 1000 * 60 * 5,
        env: {
          ...process.env,
          PROMPT: prompt.prompt,
        },
        shell: "/bin/bash",
      }
    );

    prompt.finishedAt = Date.now();

    const interactionResultDir = getDirForResult(prompt.interaction);
    await fs.mkdir(interactionResultDir, { recursive: true });

    prompt.resultImagePaths = [];

    for (const file of await fs.readdir(path.join(process.env.PATH_TO_FASTSDCPU + "results"), {
      withFileTypes: true,
    })) {
      // file starts with uuid4 -> 35 chars
      const newPath = path.join(interactionResultDir, "result" + file.name.substring(36));
      await fs.rename(path.join(process.env.PATH_TO_FASTSDCPU + "results", file.name), newPath);

      if (file.name.endsWith(".png")) prompt.resultImagePaths.push(path.relative(".", newPath));
    }

    if (prompt.resultImagePaths.length === 0) {
      container.logger.error("no result images found");
      prompt.hadError = true;
    }

    await sendResult(prompt);

    checkAndEnqueueNextForUser(prompt.userId);
  }

  container.logger.info("queue empty");

  running = false;
}

function getDirForResult(interaction: Interaction) {
  const userId = interaction.user.id;
  const interactionId = interaction.id;

  return path.resolve("generated", userId, interactionId);
}

async function sendResult(promptResult: PromptResult) {
  if (promptResult.hadError) {
    await promptResult.interaction.editReply({
      content: "😖 Something went wrong while generating the image",
    });
    return;
  }

  const timeInQueue = promptResult.generatingStartedAt - promptResult.enqueuedAt;
  const timeGenerating = promptResult.finishedAt - promptResult.generatingStartedAt;

  const embed = new EmbedBuilder()
    .setAuthor({
      name: "Image Generated",
      iconURL: twemojiUrl("✨"),
    })
    .setDescription(`#   ${promptResult.prompt}`)
    .setColor(QuinterColors.Green)
    .addFields([
      {
        name: "time enqueued",
        value: `${(timeInQueue / 1000).toFixed(2)}s`,
        inline: true,
      },
      {
        name: "time generating",
        value: `${(timeGenerating / 1000).toFixed(2)}s`,
        inline: true,
      },
      {
        name: "requested by",
        value: `<@${promptResult.userId}>`,
      },
    ])
    .setURL(
      encodeInURL<PromptInfo>({
        generatingStartedAt: promptResult.generatingStartedAt,
        enqueuedAt: promptResult.enqueuedAt,
        finishedAt: promptResult.finishedAt,
        prompt: promptResult.prompt,
        resultImagePaths: promptResult.resultImagePaths,
      })
    );

  const attachements = promptResult.resultImagePaths.map(
    imgPath => new AttachmentBuilder(path.resolve(imgPath))
  );

  await promptResult.interaction.followUp({
    embeds: [embed],
    files: attachements,
  });
}
