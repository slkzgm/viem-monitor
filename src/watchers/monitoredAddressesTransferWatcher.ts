// src/watchers/monitoredAddressesTransferWatcher.ts

/**
 * This watcher listens for all Transfer events chain-wide,
 * but filters at the RPC level for "from" or "to" belonging to our monitored wallets.
 * Then watchers manager calls onERC20Transfer / onERC721Transfer in the handler.
 */

import { IWatcherDefinition } from "../types";
import { OptionalClientsManager } from "../clients/optionalClientsManager";
import { MONITORED_WALLETS } from "./walletActivityWatcher";
import { MonitoredAddressesTransferHandler } from "../handlers/monitoredAddressesTransferHandler";

const fromAddresses = MONITORED_WALLETS.filter(
  (w) => w.direction === "from" || w.direction === "both",
).map((w) => w.address.toLowerCase());

const toAddresses = MONITORED_WALLETS.filter(
  (w) => w.direction === "to" || w.direction === "both",
).map((w) => w.address.toLowerCase());

const watchers: IWatcherDefinition[] = [];

/**
 * We define two watchers:
 * - "MonitoredAddresses_Transfer_From" => filters logs where `from` is in our set.
 * - "MonitoredAddresses_Transfer_To" => filters logs where `to` is in our set.
 */
if (fromAddresses.length > 0) {
  watchers.push({
    config: {
      name: "MonitoredAddresses_Transfer_From",
      args: {
        from: fromAddresses,
      },
    },
    createHandler: (clients: OptionalClientsManager) => {
      // MonitoredAddressesTransferHandler now implements IUniversalHandler
      return new MonitoredAddressesTransferHandler(clients, MONITORED_WALLETS);
    },
  });
}

if (toAddresses.length > 0) {
  watchers.push({
    config: {
      name: "MonitoredAddresses_Transfer_To",
      args: {
        to: toAddresses,
      },
    },
    createHandler: (clients: OptionalClientsManager) => {
      return new MonitoredAddressesTransferHandler(clients, MONITORED_WALLETS);
    },
  });
}

export const WATCHERS = watchers;
