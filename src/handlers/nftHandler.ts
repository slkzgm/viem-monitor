// src/handlers/nftHandler.ts

/**
 * Handler for NFT Transfer events (ERC-721).
 */

import { IUniversalHandler } from "../types";
import { createPrefixedLogger } from "../logger/logger";
import { OptionalClientsManager } from "../clients/optionalClientsManager";
import {
  DISCORD_DEFAULT_CHANNEL_ID,
  TELEGRAM_DEFAULT_CHANNEL_ID,
} from "../config";

export class NftHandler implements IUniversalHandler {
  private log = createPrefixedLogger("NFT_Handler");

  constructor(private optionalClients: OptionalClientsManager) {}

  public async onERC721Transfer(logs: any[]): Promise<void> {
    for (const log of logs) {
      const from = log.args?.from;
      const to = log.args?.to;
      const tokenId = log.args?.tokenId?.toString() || "?";

      this.log.info(
        `NFT Transfer => from: ${from}, to: ${to}, tokenId: ${tokenId}`,
      );

      const message = `NFT Transfer:
- Contract: ${log.address}
- From: ${from}
- To: ${to}
- TokenId: ${tokenId}`;

      // Example broadcast
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
