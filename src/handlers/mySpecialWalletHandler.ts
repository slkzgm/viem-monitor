// src/handlers/mySpecialWalletHandler.ts

/**
 * Custom logic for a specific wallet.
 * Only deals with raw transactions from watchBlocks,
 * so we implement onTransactions(...) from IUniversalHandler.
 */

import { IUniversalHandler } from "../types";
import { createPrefixedLogger } from "../logger/logger";
import { OptionalClientsManager } from "../clients/optionalClientsManager";

export class MySpecialWalletHandler implements IUniversalHandler {
  private log = createPrefixedLogger("MySpecialWalletHandler");

  constructor(private clients: OptionalClientsManager) {}

  public async onTransactions(txs: any[]): Promise<void> {
    for (const tx of txs) {
      this.log.info(`MySpecialWalletHandler => Handling tx hash: ${tx.hash}`);
      // Example broadcast or logging
    }
  }
}
