// src/handlers/anotherWalletHandler.ts

/**
 * Another specialized handler for a different wallet or logic.
 * Here, we demonstrate using a prefixed logger (createPrefixedLogger).
 */

import { IEventHandler } from "../types";
import { createPrefixedLogger } from "../logger/logger";
import { OptionalClientsManager } from "../clients/optionalClientsManager";

export class AnotherWalletHandler implements IEventHandler {
  private log = createPrefixedLogger("AnotherWalletHandler");

  constructor(private clients: OptionalClientsManager) {}

  public async handleEvent(txArray: any[]): Promise<void> {
    for (const tx of txArray) {
      this.log.info(`Handling tx hash: ${tx.hash}`);

      // Another custom logic, maybe just log and tweet
      const shortMsg = `Address used: ${tx.from} => ${tx.to}, Hash: ${tx.hash}`;
      if (this.clients.twitterClient) {
        try {
          await this.clients.twitterClient.sendTweet(shortMsg);
          this.log.info("Posted about wallet transaction on Twitter.");
        } catch (err: any) {
          this.log.error(`Error sending tweet: ${err.message}`);
        }
      }
    }
  }
}
