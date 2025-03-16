// src/watchers/walletsActivityWatcher.ts

/**
 * A single watcher for all wallet activity.
 * We store a list of wallets, each with its own direction & handler creation.
 * "watchBlock" is used to scan each block's transactions for relevant matches.
 */

import { OptionalClientsManager } from "../clients/optionalClientsManager";
import { IWatcherDefinition, IWatcherConfig } from "../types";
import { MasterWalletActivityHandler } from "../handlers/masterWalletActivityHandler";
import { MySpecialWalletHandler } from "../handlers/mySpecialWalletHandler";
import { AnotherWalletHandler } from "../handlers/anotherWalletHandler";

/**
 * If you want "one config file" for wallets, you can define them here
 * or load them from JSON, env, or DB.
 * Each wallet has:
 *  - address: The EOA to monitor
 *  - direction: "from", "to", or "both"
 *  - createHandler: a factory that returns the custom handler for that wallet
 */
const MONITORED_WALLETS = [
  {
    address: "0x1B2C84dd7957b1e207Cd7b01Ded77984eC16fDEf",
    direction: "from",
    createHandler: (clients: OptionalClientsManager) =>
      new MySpecialWalletHandler(clients),
  },
  {
    address: "0x700d7b774f5af65d26e5b9ae969ca9611ff80f6d",
    direction: "both",
    createHandler: (clients: OptionalClientsManager) =>
      new AnotherWalletHandler(clients),
  },
  // Add as many wallets as you want here...
];

/**
 * We'll define a single watcher config for "AllWallets_Activity_Watcher".
 * We do NOT specify 'address' or 'abi' because we are using watchBlock
 * to detect chain-wide transactions.
 */
const watchBlockConfig: IWatcherConfig = {
  name: "AllWallets_Activity_Watcher",
  // No address or abi needed
};

/**
 * Our createHandler function returns a "MasterWalletActivityHandler"
 * that itself knows about all wallet definitions.
 */
function createMasterHandler(clients: OptionalClientsManager) {
  return new MasterWalletActivityHandler(clients, MONITORED_WALLETS);
}

export const WATCHERS: IWatcherDefinition[] = [
  {
    config: watchBlockConfig,
    createHandler: createMasterHandler,
  },
];
