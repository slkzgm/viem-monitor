// src/watchers/walletActivityWatcher.ts

/**
 * A single watcher for all wallet activity.
 * We store a list of wallets, each with its own direction & handler creation.
 * "watchBlocks" is used to scan each new block's transactions for relevant matches.
 */

import { OptionalClientsManager } from "../clients/optionalClientsManager";
import { IWatcherDefinition, IWatcherConfig } from "../types";
import { MasterWalletActivityHandler } from "../handlers/masterWalletActivityHandler";
import { MySpecialWalletHandler } from "../handlers/mySpecialWalletHandler";
import { AnotherWalletHandler } from "../handlers/anotherWalletHandler";

/**
 * The array of monitored wallets, each specifying:
 *  - address
 *  - direction: "from"|"to"|"both" (use "as const" for TS literal type)
 *  - createHandler: returns a custom IEventHandler
 */
const MONITORED_WALLETS = [
  {
    address: "0x1B2C84dd7957b1e207Cd7b01Ded77984eC16fDEf",
    direction: "from" as const,
    createHandler: (clients: OptionalClientsManager) =>
      new MySpecialWalletHandler(clients),
  },
  {
    address: "0x700d7b774f5af65d26e5b9ae969ca9611ff80f6d",
    direction: "both" as const,
    createHandler: (clients: OptionalClientsManager) =>
      new AnotherWalletHandler(clients),
  },
  // Add as many wallets as you need here...
];

/**
 * We'll define a single watcher config for "AllWallets_Activity_Watcher".
 * We do NOT specify address/abi because we rely on watchBlocks in watcherManager.
 */
const watchBlockConfig: IWatcherConfig = {
  name: "AllWallets_Activity_Watcher",
};

/**
 * createMasterHandler => returns a MasterWalletActivityHandler
 * that will route each transaction to the correct wallet's custom handler.
 */
function createMasterHandler(clients: OptionalClientsManager) {
  return new MasterWalletActivityHandler(clients, MONITORED_WALLETS);
}

/**
 * Exported WATCHERS array so watchers/index.ts automatically includes it.
 */
export const WATCHERS: IWatcherDefinition[] = [
  {
    config: watchBlockConfig,
    createHandler: createMasterHandler,
  },
];
