// src/watcherManager.ts

/**
 * Manages all event watchers. On reconnect, re-register watchers automatically.
 */

import { parseAbiItem } from "viem";
import { Logger } from "./logger";
import { IEventHandler, IWatcherConfig } from "./types";
import { publicClient, clientEvents, createViemClient } from "./client";

// Each watcher is stored with both its config & handler
interface StoredWatcher {
  config: IWatcherConfig;
  handler: IEventHandler;
  unwatchFn: () => void; // provided by viem's watch* methods
}

export class WatcherManager {
  private watchers = new Map<string, StoredWatcher>();

  constructor() {
    /**
     * When the 'reconnect' event is emitted from our client,
     * we re-initialize the viem client & re-subscribe watchers.
     */
    clientEvents.on("reconnect", async () => {
      this.handleReconnection();
    });
  }

  public addWatcher(config: IWatcherConfig, handler: IEventHandler): void {
    Logger.info(`Initializing watcher "${config.name}"...`);
    const unwatchFn = this.createViemWatcher(config, handler);
    this.watchers.set(config.name, { config, handler, unwatchFn });
  }

  public removeWatcher(name: string): void {
    const stored = this.watchers.get(name);
    if (!stored) {
      Logger.warn(`Watcher "${name}" not found.`);
      return;
    }
    Logger.info(`Removing watcher "${name}".`);
    stored.unwatchFn(); // Stop the subscription
    this.watchers.delete(name);
  }

  public removeAllWatchers(): void {
    for (const [name] of this.watchers) {
      this.removeWatcher(name);
    }
  }

  /**
   * Internal method to create a watch (contract or generic).
   */
  private createViemWatcher(
    config: IWatcherConfig,
    handler: IEventHandler,
  ): () => void {
    const { address, abi, eventName, args, fromBlock } = config;

    // If we have an ABI + event name, use watchContractEvent
    if (abi && eventName) {
      return publicClient.watchContractEvent({
        address,
        abi,
        eventName,
        args,
        fromBlock,
        // Important: poll is false by default for webSocket transport
        poll: false,
        onLogs: async (logs) => {
          Logger.info(`[${config.name}] Received ${logs.length} log(s).`);
          await handler.handleEvent(logs);
        },
        onError: (err) => {
          Logger.error(`[${config.name}] Error: ${err.message}`);
        },
      });
    } else {
      // Otherwise, use a "generic" watchEvent
      const defaultEvent = parseAbiItem(
        "event Transfer(address indexed from, address indexed to, uint256 value)",
      );
      return publicClient.watchEvent({
        address,
        event: defaultEvent,
        args,
        fromBlock,
        poll: false,
        onLogs: async (logs) => {
          Logger.info(`[${config.name}] Received ${logs.length} log(s).`);
          await handler.handleEvent(logs);
        },
        onError: (err) => {
          Logger.error(`[${config.name}] Error: ${err.message}`);
        },
      });
    }
  }

  /**
   * Called when we detect a reconnection event from the client.
   * 1) We re-create the publicClient reference.
   * 2) Re-subscribe all watchers.
   */
  private handleReconnection(): void {
    Logger.info(
      "Reconnection event triggered. Re-initializing the viem client now...",
    );
    // 1) Re-create the publicClient
    publicClient = createViemClient();

    Logger.info("publicClient re-created. Now re-subscribing watchers...");
    // 2) Re-subscribe watchers
    for (const [name, stored] of this.watchers) {
      // Stop old subscription if it still exists
      stored.unwatchFn();
      // Create a new subscription
      const newUnwatchFn = this.createViemWatcher(
        stored.config,
        stored.handler,
      );
      // Update map
      this.watchers.set(name, { ...stored, unwatchFn: newUnwatchFn });
      Logger.info(`Watcher "${name}" re-subscribed successfully.`);
    }
  }
}
