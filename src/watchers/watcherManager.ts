// src/watchers/watcherManager.ts

/**
 * Manages all event watchers. On reconnect, re-register watchers automatically.
 */

import { parseAbiItem } from "viem";
import { Logger } from "../logger/logger";
import { IEventHandler, IWatcherConfig } from "../types";
import { publicClient, clientEvents, createViemClient } from "./client";

interface StoredWatcher {
  config: IWatcherConfig;
  handler: IEventHandler;
  unwatchFn: () => void;
}

export class WatcherManager {
  private watchers = new Map<string, StoredWatcher>();

  constructor() {
    // If a reconnect event is emitted, re-initialize the viem client & watchers
    clientEvents.on("reconnect", async () => {
      // We can make this async if we want to wait for something,
      // but for now it's synchronous
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
    stored.unwatchFn();
    this.watchers.delete(name);
  }

  public removeAllWatchers(): void {
    for (const [name] of this.watchers) {
      this.removeWatcher(name);
    }
  }

  private createViemWatcher(
    config: IWatcherConfig,
    handler: IEventHandler,
  ): () => void {
    const { address, abi, eventName, args, fromBlock } = config;

    if (abi && eventName) {
      // watchContractEvent
      return publicClient.watchContractEvent({
        address,
        abi,
        eventName,
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
    } else {
      // Generic watchEvent example
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

  private handleReconnection(): void {
    Logger.info(
      "Reconnection event triggered. Re-initializing the viem client now...",
    );

    // 1) Re-create the publicClient
    publicClient = createViemClient();

    Logger.info("publicClient re-created. Now re-subscribing watchers...");

    // 2) Re-subscribe watchers
    for (const [name, stored] of this.watchers) {
      stored.unwatchFn(); // stop old subscription
      const newUnwatchFn = this.createViemWatcher(
        stored.config,
        stored.handler,
      );
      this.watchers.set(name, { ...stored, unwatchFn: newUnwatchFn });
      Logger.info(`Watcher "${name}" re-subscribed successfully.`);
    }
  }
}
