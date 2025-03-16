// src/watchers/nftWatcher.ts

/**
 * Defines watchers for NFT transfers, etc.
 */

import { IWatcherConfig } from "../types";
import { NftHandler } from "../handlers/nftHandler";
import { OptionalClientsManager } from "../clients/optionalClientsManager";

// Example NFT Transfer ABI
const nftTransferAbi = [
  {
    type: "event",
    name: "Transfer",
    inputs: [
      { type: "address", name: "from", indexed: true },
      { type: "address", name: "to", indexed: true },
      { type: "uint256", name: "tokenId", indexed: true },
    ],
  },
];

export const WATCHERS = [
  {
    config: {
      name: "NFT_Transfer_Watcher",
      address: "0x7c47ea32FD27d1a74Fc6e9F31Ce8162e6Ce070eB",
      abi: nftTransferAbi,
      eventName: "Transfer",
      // We can optionally filter with "args" if we only want certain from/to
    },
    createHandler: (clients: OptionalClientsManager) => {
      // This uses a specialized NFT handler that posts to Discord/Telegram/Twitter
      return new NftHandler(clients);
    },
  },
];
