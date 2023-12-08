import { container } from "@sapphire/framework";

export type Meme = {
  postLink: string;
  subreddit: string;
  title: string;
  url: string;
  nsfw: boolean;
  spoiler: boolean;
  author: string;
  ups: number;
  preview: string[];
};

const MAX_TRIES = 5;

export async function getMeme(subreddit: string): Promise<Meme | undefined> {
  let json: Meme | undefined;

  let tries = 0;

  do {
    container.logger.info(subreddit);
    const response = await fetch(`https://meme-api.com/gimme/${subreddit}`);
    json = await response.json();

    if (!response.ok) {
      container.logger.info(
        `meme api returned ${response.status} ${response.statusText} for r/${subreddit}`
      );
      return;
    }

    if (!json?.nsfw) return json;
  } while (tries++ < MAX_TRIES);

  container.logger.warn(`could not get sfw meme from r/${subreddit} tries`);
  return;
}
