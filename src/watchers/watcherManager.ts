// src/watchers/watcherManager.ts

/**
 * Manages all event watchers (contract logs, generic logs, wallet transaction activity).
 * Any watcher that encounters an error triggers a one-time exponential backoff,
 * then re-creates the PublicClient & re-subscribes all watchers.
 */

import { parseAbiItem } from "viem";
import { Logger } from "../logger/logger";
import { IEventHandler, IWatcherConfig } from "../types";
import { getPublicClient, resetPublicClient } from "./client";

interface StoredWatcher {
  config: IWatcherConfig;
  handler: IEventHandler;
  unwatchFn: () => void;
}

export class WatcherManager {
  private watchers = new Map<string, StoredWatcher>();

  // For exponential backoff
  private reconnectAttempts = 0;
  private isReconnecting = false;

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

  /**
   * Creates a viem watcher. If it experiences an error,
   * we call handleWatcherError(...) to unify reconnection logic.
   */
  private createViemWatcher(config: IWatcherConfig, handler: IEventHandler) {
    const publicClient = getPublicClient();
    const { name, address, abi, eventName, args, fromBlock } = config;

    // 1) watchContractEvent if abi + eventName
    if (abi && eventName) {
      return publicClient.watchContractEvent({
        address,
        abi,
        eventName,
        args,
        fromBlock,
        onLogs: async (logs) => {
          Logger.info(`[${name}] Received ${logs.length} log(s).`);
          await handler.handleEvent(logs);
        },
        onError: (err) => this.handleWatcherError(err, name),
      });
    }

    // 2) If name == "AllWallets_Activity_Watcher" => watchBlocks for EOA tx
    if (name === "AllWallets_Activity_Watcher") {
      return publicClient.watchBlocks({
        includeTransactions: true,
        onBlock: async (block) => {
          if (!block || !block.transactions) return;
          const fullTxs = block.transactions.filter(
            (tx) => typeof tx !== "string",
          );
          if (fullTxs.length > 0) {
            await handler.handleEvent(fullTxs);
          }
        },
        onError: (err) => this.handleWatcherError(err, name),
      });
    }

    // 3) Otherwise => watchEvent fallback
    const defaultEvent = parseAbiItem(
      "event Transfer(address indexed from, address indexed to, uint256 value)",
    );
    return publicClient.watchEvent({
      address,
      event: defaultEvent,
      args,
      fromBlock,
      onLogs: async (logs) => {
        Logger.info(`[${name}] Received ${logs.length} log(s).`);
        await handler.handleEvent(logs);
      },
      onError: (err) => this.handleWatcherError(err, name),
    });
  }

  /**
   * Called whenever a watcher sees an error (like a socket closure).
   * We do an exponential backoff once, then re-initialize the client & watchers.
   */
  private handleWatcherError(error: unknown, watcherName: string) {
    Logger.error(`[${watcherName}] Watcher error: ${String(error)}`);
    if (this.isReconnecting) {
      return;
    }
    this.isReconnecting = true;
    this.scheduleReconnection();
  }

  /**
   * Perform exponential backoff up to a max attempt.
   * After delay, call handleReconnection().
   */
  private scheduleReconnection() {
    this.reconnectAttempts++;
    const MAX_ATTEMPTS = 10;
    const baseDelayMs = 1000;
    const delay = Math.min(2 ** this.reconnectAttempts * baseDelayMs, 30000);

    if (this.reconnectAttempts > MAX_ATTEMPTS) {
      Logger.error(
        "Reached maximum reconnection attempts. Will not reconnect further.",
      );
      return;
    }

    setTimeout(() => {
      this.handleReconnection();
    }, delay);
  }

  /**
   * Re-create the publicClient and re-subscribe watchers with new watchers.
   */
  private handleReconnection(): void {
    Logger.info("Re-initializing viem client & watchers after backoff...");

    resetPublicClient();
    this.isReconnecting = false;
    this.reconnectAttempts = 0;

    // Re-subscribe watchers
    for (const [name, stored] of this.watchers) {
      stored.unwatchFn();
      const newUnwatchFn = this.createViemWatcher(
        stored.config,
        stored.handler,
      );
      this.watchers.set(name, { ...stored, unwatchFn: newUnwatchFn });
      Logger.info(`Watcher "${name}" re-subscribed successfully.`);
    }
  }
}
