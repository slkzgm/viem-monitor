// src/clients/twitterClient.ts

/**
 * Example optional Twitter client that uses your custom library
 * "agent-twitter-client"
 */

import { logger } from "../logger/logger";

export async function initTwitterClient(
  username: string,
  password: string,
  email: string,
): Promise<any | null> {
  try {
    const { Scraper } = await import("agent-twitter-client");

    if (!username || !password) {
      logger.warn("Twitter credentials incomplete. Skipping initialization.");
      return null;
    }

    const scraper = new Scraper();
    await scraper.login(username, password, email);

    logger.info("Twitter client initialized and logged in successfully.");
    return scraper;
  } catch (error: any) {
    logger.warn(`Could not load Twitter client. Error: ${error.message}`);
    return null;
  }
}
