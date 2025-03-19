// src/watchers/erc20Watcher.ts

/**
 * Defines watchers for ERC20 Transfer events on a specific contract.
 */

import { Erc20Handler } from "../handlers/erc20Handler";
import { OptionalClientsManager } from "../clients/optionalClientsManager";
import { IWatcherDefinition } from "../types";

export const WATCHERS: IWatcherDefinition[] = [
  {
    config: {
      name: "ERC20_Transfer_Watcher",
      address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      // We'll rely on the fallback Transfer ABI in watcherManager
    },
    createHandler: (clients: OptionalClientsManager) => {
      // Erc20Handler implements IUniversalHandler => it has onERC20Transfer
      return new Erc20Handler();
    },
  },
];
