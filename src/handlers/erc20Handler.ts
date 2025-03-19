// src/handlers/erc20Handler.ts

/**
 * A dedicated event handler for ERC-20 "Transfer" events.
 * Demonstrates caching token metadata.
 */

import { IUniversalHandler } from "../types";
import { createPrefixedLogger } from "../logger/logger";
import { getTokenMetadataCached } from "../services/tokenMetadataCache";

export class Erc20Handler implements IUniversalHandler {
  private log = createPrefixedLogger("ERC20_Transfer_Handler");

  public async onERC20Transfer(logs: any[]): Promise<void> {
    for (const log of logs) {
      const from = log.args?.from;
      const to = log.args?.to;
      const value = log.args?.value?.toString() || "???";
      const contract = log.address as `0x${string}`;

      // 1) Grab the metadata from cache
      const metadata = await getTokenMetadataCached(contract);

      this.log.info(
        `ERC20 Transfer => ${metadata.symbol || "???"} from: ${from}, to: ${to}, value: ${value}`,
      );

      // e.g., "ERC20 Transfer => USDC from: 0xABC... to: 0xDEF..., value: 1000"
    }
  }
}
