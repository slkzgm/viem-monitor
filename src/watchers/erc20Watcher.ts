// src/watchers/erc20Watcher.ts

/**
 * Defines watchers for ERC20 events (e.g., Transfer).
 */

import { Erc20Handler } from "../handlers/erc20Handler";
import { OptionalClientsManager } from "../clients/optionalClientsManager";

/**
 * We'll export a named constant with watchers, so that index.ts
 * can discover it automatically.
 */
export const WATCHERS = [
  {
    config: {
      name: "ERC20_Transfer_Watcher",
      address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      // Possibly define an ABI if you want custom logs,
      // or rely on the default Transfer ABI in watcherManager
    },
    createHandler: (clients: OptionalClientsManager) => {
      // Return a new TransferHandler
      // (you can pass optionalClients if you want to broadcast to Telegram, etc.)
      return new Erc20Handler();
    },
  },
];
