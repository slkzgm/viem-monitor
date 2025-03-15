// src/clients/twitterClient.ts

/**
 * Example optional Twitter client that uses your custom library
 * "agent-twitter-client" from https://github.com/bozoverse/agent-twitter-client
 */

import { Logger } from "../logger/logger";

export async function initTwitterClient(
  username: string,
  password: string,
  email: string,
): Promise<any | null> {
  try {
    const { Scraper } = await import("agent-twitter-client");

    if (!username || !password) {
      Logger.warn(
        "Twitter credentials incomplete. Skipping Twitter client initialization.",
      );
      return null;
    }

    const scraper = new Scraper();
    await scraper.login(username, password, email);

    Logger.info("Twitter client initialized and logged in successfully.");
    return scraper;
  } catch (error: any) {
    Logger.warn(`Could not load Twitter client. Error: ${error.message}`);
    return null;
  }
}
