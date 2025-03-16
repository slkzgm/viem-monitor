// src/handlers/mySpecialWalletHandler.ts

/**
 * Custom logic for a specific wallet. We might broadcast to Discord,
 * store in DB, or do something special for that wallet.
 */

import { IEventHandler } from "../types";
import { Logger } from "../logger/logger";
import { OptionalClientsManager } from "../clients/optionalClientsManager";

export class MySpecialWalletHandler implements IEventHandler {
  constructor(private clients: OptionalClientsManager) {}

  public async handleEvent(txArray: any[]): Promise<void> {
    for (const tx of txArray) {
      Logger.info(`[MySpecialWalletHandler] Handling tx hash: ${tx.hash}`);

      // Example of a custom message
      const message = `Wallet 0x1B2C84dd... initiated tx with hash: ${tx.hash}\nValue: ${tx.value}`;

      // Maybe we only post to Discord & Telegram, skip Twitter:
      if (this.clients.discordClient) {
        try {
          // Example usage, referencing your config for default channel
          await this.clients.discordClient.channels.cache
            .get(process.env.DISCORD_DEFAULT_CHANNEL_ID)
            .send(`**MySpecialWallet TX:**\n${message}`);
        } catch (err: any) {
          Logger.error(`[Discord] Error: ${err.message}`);
        }
      }

      if (this.clients.telegramClient) {
        try {
          await this.clients.telegramClient.sendMessage(
            process.env.TELEGRAM_DEFAULT_CHANNEL_ID,
            `MySpecialWallet TX:\n${message}`,
          );
        } catch (err: any) {
          Logger.error(`[Telegram] Error: ${err.message}`);
        }
      }
      // etc. (or do any other logic you want)
    }
  }
}
