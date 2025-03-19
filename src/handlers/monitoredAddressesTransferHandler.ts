// src/handlers/monitoredAddressesTransferHandler.ts

/**
 * MonitoredAddressesTransferHandler:
 * This handler receives Transfer(...) logs for your monitored wallets
 * (filtered at the RPC level for 'from' or 'to').
 * Then it re-checks which wallet(s) match and routes them to sub-handlers.
 * We also skip certain fee transfers if needed.
 */

import { IUniversalHandler } from "../types";
import { createPrefixedLogger } from "../logger/logger";
import { OptionalClientsManager } from "../clients/optionalClientsManager";
import { SingleWalletDefinition } from "./masterWalletActivityHandler";

// Example fee address to skip
const FEE_ADDRESS = "0x0000000000000000000000000000000000008001".toLowerCase();

export class MonitoredAddressesTransferHandler implements IUniversalHandler {
  private log = createPrefixedLogger("MonitoredAddressesTransferHandler");

  private walletHandlers: Record<
    string,
    {
      label: string;
      direction: "from" | "to" | "both";
      handlerInstance: IUniversalHandler;
    }
  > = {};

  constructor(
    private optionalClients: OptionalClientsManager,
    private monitoredWallets: SingleWalletDefinition[],
  ) {
    for (const w of monitoredWallets) {
      const key = w.address.toLowerCase();
      this.walletHandlers[key] = {
        label: w.label,
        direction: w.direction,
        handlerInstance: w.createHandler(this.optionalClients),
      };
    }
  }

  /**
   * Called by watchers manager for "Transfer" logs with no tokenId => onERC20Transfer
   */
  public async onERC20Transfer(logs: any[]): Promise<void> {
    for (const log of logs) {
      const fromAddr = (log.args?.from || "").toLowerCase();
      const toAddr = (log.args?.to || "").toLowerCase();

      if (fromAddr === FEE_ADDRESS || toAddr === FEE_ADDRESS) {
        this.log.debug(
          `Skipping fee-related transfer from ${fromAddr} to ${toAddr}.`,
        );
        continue;
      }

      // Route sub-handlers
      for (const [
        walletKey,
        { label, direction, handlerInstance },
      ] of Object.entries(this.walletHandlers)) {
        const matchFrom =
          (direction === "from" || direction === "both") &&
          fromAddr === walletKey;
        const matchTo =
          (direction === "to" || direction === "both") && toAddr === walletKey;

        if (matchFrom || matchTo) {
          this.log.info(
            `ERC20 => Matched wallet: ${label}, from: ${fromAddr}, to: ${toAddr}`,
          );
          // Forward to sub-handler's onERC20Transfer if it exists
          await handlerInstance.onERC20Transfer?.([log]);
        }
      }
    }
  }

  /**
   * Called by watchers manager for "Transfer" logs that contain a tokenId => onERC721Transfer
   */
  public async onERC721Transfer(logs: any[]): Promise<void> {
    for (const log of logs) {
      const fromAddr = (log.args?.from || "").toLowerCase();
      const toAddr = (log.args?.to || "").toLowerCase();

      if (fromAddr === FEE_ADDRESS || toAddr === FEE_ADDRESS) {
        this.log.debug(
          `Skipping fee-related NFT transfer from ${fromAddr} to ${toAddr}.`,
        );
        continue;
      }

      for (const [
        walletKey,
        { label, direction, handlerInstance },
      ] of Object.entries(this.walletHandlers)) {
        const matchFrom =
          (direction === "from" || direction === "both") &&
          fromAddr === walletKey;
        const matchTo =
          (direction === "to" || direction === "both") && toAddr === walletKey;

        if (matchFrom || matchTo) {
          this.log.info(
            `ERC721 => Matched wallet: ${label}, from: ${fromAddr}, to: ${toAddr}`,
          );
          // Forward to sub-handler's onERC721Transfer if it exists
          await handlerInstance.onERC721Transfer?.([log]);
        }
      }
    }
  }
}
