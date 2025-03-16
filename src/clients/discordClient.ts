// src/clients/discordClient.ts

/**
 * Example optional Discord client using discord.js (v14+).
 * Dynamic import to avoid crashes if not installed.
 */

import { logger } from "../logger/logger";

export async function initDiscordClient(token: string): Promise<any | null> {
  if (!token) {
    logger.warn(
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
      logger.info(`[Discord] Logged in as ${client.user?.tag}.`);
    });

    logger.info("Discord client initialized successfully.");
    return client;
  } catch (error: any) {
    logger.warn(`Could not load discord.js. Error: ${error.message}`);
    return null;
  }
}
