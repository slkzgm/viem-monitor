// src/clients/optionalClientsManager.ts

/**
 * Orchestrates optional clients.
 * You can broadcast to all if needed.
 */

import {
  ENABLE_DISCORD,
  ENABLE_TELEGRAM,
  ENABLE_TWITTER,
  TWITTER_USERNAME,
  TWITTER_PASSWORD,
  TWITTER_EMAIL,
  DISCORD_TOKEN,
  TELEGRAM_TOKEN,
  DISCORD_DEFAULT_CHANNEL_ID,
  TELEGRAM_DEFAULT_CHANNEL_ID,
} from "../config";
import { initDiscordClient } from "./discordClient";
import { initTelegramClient } from "./telegramClient";
import { initTwitterClient } from "./twitterClient";
import { Logger } from "../logger/logger";

export class OptionalClientsManager {
  public discordClient: any | null = null;
  public telegramClient: any | null = null;
  public twitterScraper: any | null = null;

  public async initAll(): Promise<void> {
    // 1) Discord
    if (ENABLE_DISCORD && DISCORD_DEFAULT_CHANNEL_ID) {
      this.discordClient = await initDiscordClient(DISCORD_TOKEN);
    } else {
      Logger.info(
        "Discord client is disabled in config or default channel not set.",
      );
    }

    // 2) Telegram
    if (ENABLE_TELEGRAM && TELEGRAM_DEFAULT_CHANNEL_ID) {
      this.telegramClient = await initTelegramClient(TELEGRAM_TOKEN);
    } else {
      Logger.info(
        "Telegram client is disabled in config or default channel not set.",
      );
    }

    // 3) Twitter
    if (ENABLE_TWITTER) {
      this.twitterScraper = await initTwitterClient(
        TWITTER_USERNAME,
        TWITTER_PASSWORD,
        TWITTER_EMAIL,
      );
    } else {
      Logger.info("Twitter client is disabled in config.");
    }

    Logger.info("Optional clients initialization completed.");
  }

  public async broadcastMessage(message: string): Promise<void> {
    // Discord
    if (this.discordClient) {
      try {
        // Example usage - user must define channel ID in code or config
        await this.discordClient.channels.cache
          .get(DISCORD_DEFAULT_CHANNEL_ID)
          .send(message);
        Logger.info("[Discord] Message sent successfully.");
      } catch (err: any) {
        Logger.error(`[Discord] Error sending message: ${err.message}`);
      }
    }

    // Telegram
    if (this.telegramClient) {
      try {
        await this.telegramClient.sendMessage(
          TELEGRAM_DEFAULT_CHANNEL_ID,
          message,
        );
        Logger.info("[Telegram] Message sent successfully.");
      } catch (err: any) {
        Logger.error(`[Telegram] Error sending message: ${err.message}`);
      }
    }

    // Twitter
    if (this.twitterScraper) {
      try {
        await this.twitterScraper.sendTweet(message);
        Logger.info("[Twitter] Tweet sent successfully.");
      } catch (err: any) {
        Logger.error(`[Twitter] Error sending tweet: ${err.message}`);
      }
    }
  }
}
