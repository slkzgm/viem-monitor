// src/handlers/masterWalletActivityHandler.ts

/**
 * The "MasterWalletActivityHandler" receives block transactions,
 * then routes each tx to the correct wallet-level handler based on from/to address.
 */

import { IEventHandler } from "../types";
import { createPrefixedLogger } from "../logger/logger";
import { OptionalClientsManager } from "../clients/optionalClientsManager";

/**
 * singleWalletDefinition includes a label, address, direction, etc.
 */
export interface SingleWalletDefinition {
  label: string;
  address: string;
  direction: "from" | "to" | "both";
  createHandler: (clients: OptionalClientsManager) => IEventHandler;
}

export class MasterWalletActivityHandler implements IEventHandler {
  private log = createPrefixedLogger("MasterWalletActivityHandler");

  private walletHandlers: Record<string, IEventHandler> = {};
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
   * handleEvent(txs): We get an array of transactions from watchBlocks in watcherManager.
   */
  public async handleEvent(txs: any[]): Promise<void> {
    for (const tx of txs) {
      const fromAddr = (tx.from || "").toLowerCase();
      const toAddr = (tx.to || "").toLowerCase();

      for (const wKey in this.walletHandlers) {
        const walletLabel = this.walletLabels[wKey] || "Unknown";
        if (fromAddr === wKey || toAddr === wKey) {
          this.log.info(`Matched wallet: ${walletLabel}, Tx hash: ${tx.hash}`);
          await this.walletHandlers[wKey].handleEvent([tx]);
        }
      }
    }
  }
}
