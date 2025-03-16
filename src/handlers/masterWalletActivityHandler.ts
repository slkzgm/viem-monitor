// src/handlers/masterWalletActivityHandler.ts

/**
 * The "MasterWalletActivityHandler" is the single handler that will receive
 * all block transaction data from watchBlock. It then routes each transaction
 * to the correct "wallet-level" handler if it matches an address & direction.
 */

import { IEventHandler } from "../types";
import { Logger } from "../logger/logger";
import { OptionalClientsManager } from "../clients/optionalClientsManager";

/**
 * A single wallet definition from watchers/walletsActivityWatcher:
 */
export interface SingleWalletDefinition {
  address: string;
  direction: "from" | "to" | "both";
  createHandler: (clients: OptionalClientsManager) => IEventHandler;
}

/**
 * We store the actual "wallet-level" handlers in a map, keyed by address
 * (since each address has its own custom handler instance).
 */
export class MasterWalletActivityHandler implements IEventHandler {
  private walletDefinitions: SingleWalletDefinition[];
  private walletHandlers: Record<string, IEventHandler> = {};

  constructor(
    private optionalClients: OptionalClientsManager,
    wallets: SingleWalletDefinition[],
  ) {
    this.walletDefinitions = wallets;

    // Create each wallet's handler instance now, store in a dictionary
    for (const w of wallets) {
      // We'll lowercase the address for easy matching
      const key = w.address.toLowerCase();
      this.walletHandlers[key] = w.createHandler(this.optionalClients);
    }
  }

  /**
   * handleEvent(txs): We receive an array of transactions from watchers/watcherManager
   * because watchBlock is returning block transactions.
   */
  public async handleEvent(txs: any[]): Promise<void> {
    // We expect each "txs" item to be a transaction object
    for (const tx of txs) {
      const fromAddr = (tx.from || "").toLowerCase();
      const toAddr = (tx.to || "").toLowerCase();

      // We'll loop through each wallet definition
      for (const walletDef of this.walletDefinitions) {
        const walletAddress = walletDef.address.toLowerCase();

        // If direction = "from" or "both", check if fromAddr == walletAddress
        if (
          (walletDef.direction === "from" || walletDef.direction === "both") &&
          fromAddr === walletAddress
        ) {
          await this.callWalletHandler(tx, walletAddress, "FROM");
        }

        // If direction = "to" or "both", check if toAddr == walletAddress
        if (
          (walletDef.direction === "to" || walletDef.direction === "both") &&
          toAddr === walletAddress
        ) {
          await this.callWalletHandler(tx, walletAddress, "TO");
        }
      }
    }
  }

  /**
   * Calls the dedicated handler for the matched wallet address.
   */
  private async callWalletHandler(
    tx: any,
    walletAddress: string,
    directionLabel: "FROM" | "TO",
  ) {
    Logger.info(
      `MasterWalletActivityHandler: Transaction ${directionLabel} wallet ${walletAddress}, hash: ${tx.hash}`,
    );

    // Retrieve the wallet's custom handler from our map
    const handler = this.walletHandlers[walletAddress];
    if (!handler) {
      Logger.warn(
        `No custom handler found for wallet ${walletAddress}, skipping...`,
      );
      return;
    }

    // We pass the single transaction to that handler's handleEvent
    // We can pass it as an array [tx], or define a new method in the sub-handler
    await handler.handleEvent([tx]);
  }
}
