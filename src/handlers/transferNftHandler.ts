// src/handlers/transferNftHandler.ts

/**
 * This handler listens for Transfer(address from, address to, uint256 tokenId)
 * events on a specific NFT contract. Upon receiving logs, it posts to:
 * - Discord
 * - Telegram
 * - Twitter
 *
 * The OptionalClientsManager is injected so we can call broadcast-like methods.
 */

import { IEventHandler } from "../types";
import { Logger } from "../logger/logger";
import { OptionalClientsManager } from "../clients/optionalClientsManager";
import {
  DISCORD_FALLBACK_CHANNEL_ID,
  TELEGRAM_FALLBACK_CHANNEL_ID,
} from "../config";

export class TransferNftHandler implements IEventHandler {
  constructor(private optionalClients: OptionalClientsManager) {}

  public async handleEvent(logs: any[]): Promise<void> {
    for (const log of logs) {
      // Typically, log.args might be: { from, to, tokenId } if ABI is correct
      const from = log.args?.from;
      const to = log.args?.to;
      const tokenId = log.args?.tokenId;

      Logger.info(
        `Handling NFT Transfer event => from: ${from}, to: ${to}, tokenId: ${tokenId}`,
      );

      // Example message
      const message = `NFT Transfer detected!
- Contract: ${log.address}
- From: ${from}
- To: ${to}
- TokenId: ${tokenId}`;

      // 1) Discord
      if (this.optionalClients.discordClient) {
        try {
          await this.optionalClients.discordClient.channels.cache
            .get(DISCORD_FALLBACK_CHANNEL_ID)
            .send(message);
          Logger.info("[Discord] NFT Transfer message sent successfully.");
        } catch (err: any) {
          Logger.error(
            `[Discord] Error sending NFT Transfer message: ${err.message}`,
          );
        }
      }

      // 2) Telegram
      if (this.optionalClients.telegramClient) {
        try {
          await this.optionalClients.telegramClient.sendMessage(
            TELEGRAM_FALLBACK_CHANNEL_ID,
            message,
          );
          Logger.info("[Telegram] NFT Transfer message sent successfully.");
        } catch (err: any) {
          Logger.error(
            `[Telegram] Error sending NFT Transfer message: ${err.message}`,
          );
        }
      }

      // 3) Twitter
      if (this.optionalClients.twitterScraper) {
        try {
          // Keep tweets short if possible
          await this.optionalClients.twitterScraper.sendTweet(
            `New NFT Transfer: Token #${tokenId} from ${from.slice(0, 6)}... to ${to.slice(0, 6)}...`,
          );
          Logger.info("[Twitter] NFT Transfer tweet sent successfully.");
        } catch (err: any) {
          Logger.error(
            `[Twitter] Error sending NFT Transfer tweet: ${err.message}`,
          );
        }
      }
    }
  }
}
