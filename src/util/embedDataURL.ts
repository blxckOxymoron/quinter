import { Embed } from "discord.js";

export function encodeInURL(data: any) {
  const encoded = Buffer.from(JSON.stringify(data)).toString("base64");
  return "https://github.com/blxckOxymoron/quinter#" + encoded;
}

export function decodeFromEmbedURL<T extends any>(embed: Embed) {
  const [, data] = embed.url?.split("#") ?? [];
  if (!data) throw Error("recived embed without data");

  const decoded = Buffer.from(data, "base64").toString("utf-8");
  return JSON.parse(decoded) as T;
}
