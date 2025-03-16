// src/clients/telegramClient.ts

/**
 * Example optional Telegram client (node-telegram-bot-api).
 */

import { logger } from "../logger/logger";

export async function initTelegramClient(
  botToken: string,
): Promise<any | null> {
  try {
    const TelegramBot = (await import("node-telegram-bot-api")).default;

    if (!botToken) {
      logger.warn(
        "Telegram bot token is empty. Skipping Telegram client initialization.",
      );
      return null;
    }

    const bot = new TelegramBot(botToken, { polling: false });
    logger.info("Telegram client initialized successfully.");
    return bot;
  } catch (error: any) {
    logger.warn(`Could not load Telegram client. Error: ${error.message}`);
    return null;
  }
}
