// src/handlers/mySpecialWalletHandler.ts

/**
 * Custom logic for a specific wallet. We might broadcast to Discord,
 * store in DB, or do something special for that wallet.
 */

import { IEventHandler } from "../types";
import { createPrefixedLogger } from "../logger/logger";
import { OptionalClientsManager } from "../clients/optionalClientsManager";

export class MySpecialWalletHandler implements IEventHandler {
  private log = createPrefixedLogger("MySpecialWalletHandler");

  constructor(private clients: OptionalClientsManager) {}

  public async handleEvent(txArray: any[]): Promise<void> {
    for (const tx of txArray) {
      this.log.info(`Handling tx hash: ${tx.hash}`);

      // Example of a custom message
      const message = `Wallet 0x1B2C84dd... initiated tx: ${tx.hash}`;

      // Maybe we only post to Discord & Telegram, skip Twitter:
      if (this.clients.discordClient) {
        try {
          await this.clients.discordClient.channels.cache
            .get(process.env.DISCORD_DEFAULT_CHANNEL_ID)
            .send(`**MySpecialWallet TX:**\n${message}`);
          this.log.info("Posted TX info to Discord.");
        } catch (err: any) {
          this.log.error(`Discord error: ${err.message}`);
        }
      }

      if (this.clients.telegramClient) {
        try {
          await this.clients.telegramClient.sendMessage(
            process.env.TELEGRAM_DEFAULT_CHANNEL_ID,
            `MySpecialWallet TX:\n${message}`,
          );
          this.log.info("Posted TX info to Telegram.");
        } catch (err: any) {
          this.log.error(`Telegram error: ${err.message}`);
        }
      }
      // etc...
    }
  }
}
