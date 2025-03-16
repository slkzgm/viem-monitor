// src/handlers/anotherWalletHandler.ts

/**
 * Another specialized handler for a different wallet or logic.
 */

import { IEventHandler } from "../types";
import { Logger } from "../logger/logger";
import { OptionalClientsManager } from "../clients/optionalClientsManager";

export class AnotherWalletHandler implements IEventHandler {
  constructor(private clients: OptionalClientsManager) {}

  public async handleEvent(txArray: any[]): Promise<void> {
    for (const tx of txArray) {
      Logger.info(`[AnotherWalletHandler] Handling tx hash: ${tx.hash}`);

      // Another custom logic, maybe just log and tweet
      const shortMsg = `Address used: ${tx.from} => ${tx.to}, Hash: ${tx.hash}`;
      if (this.clients.twitterClient) {
        try {
          await this.clients.twitterClient.sendTweet(shortMsg);
          Logger.info("[Twitter] Posted about wallet transaction.");
        } catch (err: any) {
          Logger.error(`[Twitter] Error sending tweet: ${err.message}`);
        }
      }
    }
  }
}
