import "dotenv/config";

import { SapphireClient } from "@sapphire/framework";
import { GatewayIntentBits } from "discord.js";

const client = new SapphireClient({
  intents: [
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.Guilds,
  ],
});

client.login(process.env.BOT_TOKEN);
