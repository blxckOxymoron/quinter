import { Embed } from "discord.js";

export function encodeInURL(data: any) {
  const encoded = Buffer.from(JSON.stringify(data)).toString("base64");
  return "https://github.com/blxckOxymoron/quinter#" + encoded;
}

export function decodeFromEmbedURL<T extends any>(embed: Embed) {
  const [, data] = embed.url?.split("#") ?? [];
  if (!data) return undefined;

  const decoded = Buffer.from(data, "base64").toString("utf-8");
  try {
    return JSON.parse(decoded) as T;
  } catch {
    return undefined;
  }
}
