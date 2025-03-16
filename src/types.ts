// src/types.ts

/**
 * Shared interfaces/types for watchers, handlers, etc.
 * All logs/comments in English only.
 */

import { OptionalClientsManager } from "./clients/optionalClientsManager";

/**
 * An interface for event handlers.
 * The `handleEvent` method receives an array of logs from viem.
 */
export interface IEventHandler {
  handleEvent(logs: any[]): Promise<void>;
}

/**
 * Basic configuration for a watcher:
 * - name: Unique identifier for the watcher
 * - address: The contract address to listen on
 * - abi: If specified, will be used for watchContractEvent
 * - eventName: The event name on the ABI
 * - args: Optional indexed arguments for further filtering
 * - fromBlock: Optional starting block number
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
 * creates the event handler instance. This is useful when you want
 * to dynamically create watchers (and their handlers) in an aggregator.
 */
export interface IWatcherDefinition {
  config: IWatcherConfig;
  // The OptionalClientsManager is passed so you can post to Discord/Telegram/Twitter, etc.
  createHandler: (clients: OptionalClientsManager) => IEventHandler;
}
