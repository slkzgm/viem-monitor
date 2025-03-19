// src/watchers/nftWatcher.ts

/**
 * Defines watchers for NFT transfers (ERC721) on a specific contract.
 */

import { NftHandler } from "../handlers/nftHandler";
import { OptionalClientsManager } from "../clients/optionalClientsManager";
import { IWatcherDefinition } from "../types";

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

export const WATCHERS: IWatcherDefinition[] = [
  {
    config: {
      name: "NFT_Transfer_Watcher",
      address: "0x7c47ea32FD27d1a74Fc6e9F31Ce8162e6Ce070eB",
      abi: nftTransferAbi,
      eventName: "Transfer",
    },
    createHandler: (clients: OptionalClientsManager) => {
      // NftHandler implements IUniversalHandler => it has onERC721Transfer
      return new NftHandler(clients);
    },
  },
];
