// src/watchers/walletActivityWatcher.ts

/**
 * A single watcher for all wallet activity via block-based transactions.
 * We also export MONITORED_WALLETS for reusability.
 */

import { OptionalClientsManager } from "../clients/optionalClientsManager";
import { IWatcherDefinition, IWatcherConfig } from "../types";
import {
  MasterWalletActivityHandler,
  SingleWalletDefinition,
} from "../handlers/masterWalletActivityHandler";
import { OchDeployerWalletHandler } from "../handlers/ochDeployerWalletHandler";
import { AgwWalletHandler } from "../handlers/agwWalletHandler";

export const MONITORED_WALLETS: SingleWalletDefinition[] = [
  {
    label: "OCH Deployer",
    address: "0x1B2C84dd7957b1e207Cd7b01Ded77984eC16fDEf",
    direction: "from",
    createHandler: (clients: OptionalClientsManager) =>
      new OchDeployerWalletHandler(clients),
  },
  {
    label: "AGW Wallet",
    address: "0x700d7b774f5af65d26e5b9ae969ca9611ff80f6d",
    direction: "both",
    createHandler: (clients: OptionalClientsManager) =>
      new AgwWalletHandler(clients),
  },
];

const watchBlockConfig: IWatcherConfig = {
  name: "AllWallets_Activity_Watcher",
};

function createMasterHandler(clients: OptionalClientsManager) {
  // MasterWalletActivityHandler implements IUniversalHandler => onTransactions
  return new MasterWalletActivityHandler(clients, MONITORED_WALLETS);
}

export const WATCHERS: IWatcherDefinition[] = [
  {
    config: watchBlockConfig,
    createHandler: createMasterHandler,
  },
];
