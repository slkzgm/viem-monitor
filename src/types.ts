// src/types.ts

/**
 * Shared interfaces/types for watchers, handlers, etc.
 * All logs/comments in English only.
 */

import { OptionalClientsManager } from "./clients/optionalClientsManager";

/**
 * A universal interface for watchers to call specialized methods:
 * - onTransactions: invoked for block-based raw transactions
 * - onERC20Transfer: invoked for "Transfer(address,address,uint256)" logs
 * - onERC721Transfer: invoked for "Transfer(address,address,uint256 tokenId)" logs
 * - onERC1155TransferSingle / onERC1155TransferBatch: invoked for ERC1155
 *
 * Each method is optional, so a handler can implement only those it needs.
 */
export interface IUniversalHandler {
  onTransactions?(txs: any[]): Promise<void>;

  onERC20Transfer?(logs: any[]): Promise<void>;
  onERC721Transfer?(logs: any[]): Promise<void>;
  onERC1155TransferSingle?(logs: any[]): Promise<void>;
  onERC1155TransferBatch?(logs: any[]): Promise<void>;
}

/**
 * Basic config for a watcher.
 */
export interface IWatcherConfig {
  name: string;
  address?: `0x${string}`;
  abi?: any;
  eventName?: string;
  args?: Record<string, unknown>;
  fromBlock?: bigint;
}

/**
 * A structure combining a watcher config with a factory that
 * creates the event handler instance (IUniversalHandler).
 */
export interface IWatcherDefinition {
  config: IWatcherConfig;
  createHandler: (clients: OptionalClientsManager) => IUniversalHandler;
}
