// src/handlers/ochDeployerWalletHandler.ts

/**
 * Custom logic for a specific wallet.
 * Only deals with raw transactions from watchBlocks,
 * so we implement onTransactions(...) from IUniversalHandler.
 */

import { IUniversalHandler } from "../types";
import { createPrefixedLogger } from "../logger/logger";
import { OptionalClientsManager } from "../clients/optionalClientsManager";
import { TELEGRAM_DEFAULT_CHANNEL_ID } from "../config";

export class OchDeployerWalletHandler implements IUniversalHandler {
  private log = createPrefixedLogger("MySpecialWalletHandler");

  constructor(private clients: OptionalClientsManager) {}

  public async onTransactions(txs: any[]): Promise<void> {
    for (const tx of txs) {
      this.log.info(`Handling tx hash: ${tx.hash}`);

      const message = `OCH Deployer wallet new transaction: https://abscan.org/tx/${tx.hash}`;

      if (this.clients.telegramClient) {
        try {
          await this.clients.telegramClient.sendMessage(
            '-1002696813104',
            message,
          );
        } catch (err: any) {
          this.log.error(`Error sending telegram message: ${err.message}`);
        }
      }
    }
  }
}
