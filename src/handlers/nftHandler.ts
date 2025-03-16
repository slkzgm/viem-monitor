// src/handlers/nftHandler.ts

/**
 * This handler listens for Transfer(address from, address to, uint256 tokenId)
 * events on a specific NFT contract. It can post to Discord, Telegram, Twitter, etc.
 */

import { IEventHandler } from "../types";
import { createPrefixedLogger } from "../logger/logger";
import { OptionalClientsManager } from "../clients/optionalClientsManager";
import {
  DISCORD_DEFAULT_CHANNEL_ID,
  TELEGRAM_DEFAULT_CHANNEL_ID,
} from "../config";

export class NftHandler implements IEventHandler {
  private log = createPrefixedLogger("NFT_Handler");

  constructor(private optionalClients: OptionalClientsManager) {}

  public async handleEvent(logs: any[]): Promise<void> {
    for (const log of logs) {
      const from = log.args?.from;
      const to = log.args?.to;
      const tokenId = log.args?.tokenId;

      this.log.info(
        `Handling NFT Transfer => from: ${from}, to: ${to}, tokenId: ${tokenId}`,
      );

      const message = `NFT Transfer:
- Contract: ${log.address}
- From: ${from}
- To: ${to}
- TokenId: ${tokenId}`;

      // Discord
      if (this.optionalClients.discordClient) {
        try {
          await this.optionalClients.discordClient.channels.cache
            .get(DISCORD_DEFAULT_CHANNEL_ID)
            .send(message);
          this.log.info("Posted NFT Transfer on Discord.");
        } catch (err: any) {
          this.log.error(`Discord error: ${err.message}`);
        }
      }

      // Telegram
      if (this.optionalClients.telegramClient) {
        try {
          await this.optionalClients.telegramClient.sendMessage(
            TELEGRAM_DEFAULT_CHANNEL_ID,
            message,
          );
          this.log.info("Posted NFT Transfer on Telegram.");
        } catch (err: any) {
          this.log.error(`Telegram error: ${err.message}`);
        }
      }

      // Twitter
      if (this.optionalClients.twitterClient) {
        try {
          await this.optionalClients.twitterClient.sendTweet(
            `New NFT Transfer: Token #${tokenId} from ${from.slice(0, 6)}... to ${to.slice(0, 6)}...`,
          );
          this.log.info("Tweeted about NFT Transfer.");
        } catch (err: any) {
          this.log.error(`Twitter error: ${err.message}`);
        }
      }
    }
  }
}
