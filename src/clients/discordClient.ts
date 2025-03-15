// src/clients/discordClient.ts

/**
 * Example optional Discord client using discord.js (v14+).
 * Dynamic import to avoid crashes if not installed.
 */

import { Logger } from "../logger/logger";

export async function initDiscordClient(token: string): Promise<any | null> {
  if (!token) {
    Logger.warn(
      "Discord token is empty. Skipping Discord client initialization.",
    );
    return null;
  }

  try {
    const discordJs = await import("discord.js");
    const { Client, IntentsBitField } = discordJs;

    const client = new Client({
      intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
      ],
    });

    await client.login(token);
    client.once("ready", () => {
      Logger.info(`[Discord] Logged in as ${client.user?.tag}.`);
    });

    Logger.info("Discord client initialized successfully.");
    return client;
  } catch (error: any) {
    Logger.warn(`Could not load discord.js. Error: ${error.message}`);
    return null;
  }
}
