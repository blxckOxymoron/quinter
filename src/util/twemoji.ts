import moji from "twemoji";

export const twemojiUrl = (emoji: string, type: "svg" | "png" = "png") => {
  const folder = type === "png" ? "72x72" : "svg";
  return `https://twemoji.maxcdn.com/v/latest/${folder}/${moji.convert.toCodePoint(emoji)}.${type}`;
};
