// src/watchers/watcherManager.ts

/**
 * Manages all event watchers (contract logs, generic logs, wallet transaction activity).
 * On reconnect, re-register watchers automatically.
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
      this.handleReconnection();
    });
  }

  /**
   * Add a new watcher with the given config & handler.
   * The returned unwatch function is stored so we can remove or re-subscribe later.
   */
  public addWatcher(config: IWatcherConfig, handler: IEventHandler): void {
    Logger.info(`Initializing watcher "${config.name}"...`);
    const unwatchFn = this.createViemWatcher(config, handler);
    this.watchers.set(config.name, { config, handler, unwatchFn });
  }

  /**
   * Remove a watcher by name, stopping its subscription.
   */
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

  /**
   * Remove all watchers, useful for graceful shutdown.
   */
  public removeAllWatchers(): void {
    for (const [name] of this.watchers) {
      this.removeWatcher(name);
    }
  }

  /**
   * Depending on the config, we create one of:
   * 1) watchContractEvent (if abi + eventName)
   * 2) a special watchBlocks if "AllWallets_Activity_Watcher" (or another marker)
   * 3) watchEvent otherwise (fallback).
   */
  private createViemWatcher(
    config: IWatcherConfig,
    handler: IEventHandler,
  ): () => void {
    const { name, address, abi, eventName, args, fromBlock } = config;

    // A) If we have an ABI + eventName, it's a contract-based watcher.
    if (abi && eventName) {
      return publicClient.watchContractEvent({
        address,
        abi,
        eventName,
        args,
        fromBlock,
        // WebSocket by default uses poll: false
        poll: false,
        onLogs: async (logs) => {
          Logger.info(`[${name}] Received ${logs.length} log(s).`);
          await handler.handleEvent(logs);
        },
        onError: (err) => {
          Logger.error(`[${name}] Error: ${err.message}`);
        },
      });
    }

    // B) If name indicates a wallet transaction watcher, do watchBlocks
    if (name === "AllWallets_Activity_Watcher") {
      return publicClient.watchBlocks({
        includeTransactions: true, // we want actual tx objects
        onBlock: async (block) => {
          if (!block || !block.transactions) return;

          // Filter out string-only transactions if any
          const fullTxs = block.transactions.filter(
            (tx) => typeof tx !== "string",
          );

          if (fullTxs.length > 0) {
            await handler.handleEvent(fullTxs);
          }
        },
        onError: (err) => {
          Logger.error(`[${name}] Error: ${err.message}`);
        },
      });
    }

    // C) Otherwise, fallback to a generic watchEvent
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
        Logger.info(`[${name}] Received ${logs.length} log(s).`);
        await handler.handleEvent(logs);
      },
      onError: (err) => {
        Logger.error(`[${name}] Error: ${err.message}`);
      },
    });
  }

  /**
   * On WS reconnect, we:
   * 1) Re-create the publicClient with createViemClient()
   * 2) Re-subscribe all watchers
   */
  private handleReconnection(): void {
    Logger.info(
      "Reconnection event triggered. Re-initializing the viem client now...",
    );
    publicClient = createViemClient();
    Logger.info("publicClient re-created. Now re-subscribing watchers...");

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
