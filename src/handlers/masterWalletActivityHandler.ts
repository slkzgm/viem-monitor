// src/handlers/masterWalletActivityHandler.ts

/**
 * The "MasterWalletActivityHandler" receives block transactions
 * (not logs) from watchBlocks.
 * We implement onTransactions(...) from IUniversalHandler.
 */

import { IUniversalHandler } from "../types";
import { createPrefixedLogger } from "../logger/logger";
import { OptionalClientsManager } from "../clients/optionalClientsManager";

export interface SingleWalletDefinition {
  label: string;
  address: string;
  direction: "from" | "to" | "both";
  createHandler: (clients: OptionalClientsManager) => IUniversalHandler;
}

export class MasterWalletActivityHandler implements IUniversalHandler {
  private log = createPrefixedLogger("MasterWalletActivityHandler");

  private walletHandlers: Record<string, IUniversalHandler> = {};
  private walletLabels: Record<string, string> = {};

  constructor(
    private optionalClients: OptionalClientsManager,
    wallets: SingleWalletDefinition[],
  ) {
    for (const w of wallets) {
      const key = w.address.toLowerCase();
      this.walletHandlers[key] = w.createHandler(this.optionalClients);
      this.walletLabels[key] = w.label;
    }
  }

  /**
   * Watcher calls onTransactions(...) with an array of block-based transactions.
   */
  public async onTransactions(txs: any[]): Promise<void> {
    for (const tx of txs) {
      const fromAddr = (tx.from || "").toLowerCase();
      const toAddr = (tx.to || "").toLowerCase();

      // Find which wallet matches
      for (const wKey in this.walletHandlers) {
        const walletLabel = this.walletLabels[wKey] || "Unknown";
        if (fromAddr === wKey || toAddr === wKey) {
          this.log.info(`Matched wallet: ${walletLabel}, Tx hash: ${tx.hash}`);
          // Send the transaction to that sub-handler's onTransactions(...) or onERC20Transfer, etc.
          // But typically these sub-handlers also only implement onTransactions
          await this.walletHandlers[wKey].onTransactions?.([tx]);
        }
      }
    }
  }
}
