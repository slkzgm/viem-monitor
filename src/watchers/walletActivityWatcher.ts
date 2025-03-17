// src/watchers/walletActivityWatcher.ts

/**
 * A single watcher for all wallet activity.
 * Each wallet now has a "label" in addition to address/direction.
 */

import { OptionalClientsManager } from "../clients/optionalClientsManager";
import { IWatcherDefinition, IWatcherConfig } from "../types";
import {
  MasterWalletActivityHandler,
  SingleWalletDefinition,
} from "../handlers/masterWalletActivityHandler";
import { MySpecialWalletHandler } from "../handlers/mySpecialWalletHandler";
import { AnotherWalletHandler } from "../handlers/anotherWalletHandler";

/**
 * Now each wallet has:
 *   label: a descriptive name for logs
 *   address: the EOA to monitor
 *   direction: "from", "to", or "both"
 *   createHandler: returns a custom sub-handler
 */
const MONITORED_WALLETS: SingleWalletDefinition[] = [
  {
    label: "Dev Main Wallet",
    address: "0x1B2C84dd7957b1e207Cd7b01Ded77984eC16fDEf",
    direction: "from" as const,
    createHandler: (clients: OptionalClientsManager) =>
      new MySpecialWalletHandler(clients),
  },
  {
    label: "Shared Guild Vault",
    address: "0x700d7b774f5af65d26e5b9ae969ca9611ff80f6d",
    direction: "both" as const,
    createHandler: (clients: OptionalClientsManager) =>
      new AnotherWalletHandler(clients),
  },
];

/**
 * A single watcher config with name="AllWallets_Activity_Watcher".
 * We'll do watchBlocks in watcherManager to handle transactions chain-wide.
 */
const watchBlockConfig: IWatcherConfig = {
  name: "AllWallets_Activity_Watcher",
};

function createMasterHandler(clients: OptionalClientsManager) {
  return new MasterWalletActivityHandler(clients, MONITORED_WALLETS);
}

export const WATCHERS: IWatcherDefinition[] = [
  {
    config: watchBlockConfig,
    createHandler: createMasterHandler,
  },
];
