// src/watchers/watcherManager.ts

/**
 * Manages all watchers (block-based or log-based).
 * Here we handle fallback watchers that use "Transfer(address,address,uint256)"
 * but want to differentiate ERC20/721/1155 for from/to addresses.
 *
 * Strategy for fallback watchers:
 *  1) We get an array of logs from viem.
 *  2) Group logs by contract (log.address).
 *  3) For each unique contract, fetch metadata once (multicall).
 *  4) Partition logs into ERC20 vs. ERC721 vs. ERC1155 arrays.
 *  5) Call the relevant handler method with the appropriate array.
 */

import { parseAbiItem } from "viem";
import { IUniversalHandler, IWatcherConfig } from "../types";
import { getPublicClient, resetPublicClient } from "./client";
import { logger } from "../logger/logger";
import { getMultipleTokenMetadataCached } from "../services/tokenMetadataCache";

interface StoredWatcher {
  config: IWatcherConfig;
  handler: IUniversalHandler;
  unwatchFn: () => void;
}

export class WatcherManager {
  private watchers = new Map<string, StoredWatcher>();
  private reconnectAttempts = 0;
  private isReconnecting = false;

  public addWatcher(config: IWatcherConfig, handler: IUniversalHandler): void {
    logger.info(`Initializing watcher "${config.name}"...`);
    const unwatchFn = this.createViemWatcher(config, handler);
    this.watchers.set(config.name, { config, handler, unwatchFn });
  }

  public removeWatcher(name: string): void {
    const stored = this.watchers.get(name);
    if (!stored) {
      logger.warn(`Watcher "${name}" not found.`);
      return;
    }
    logger.info(`Removing watcher "${name}".`);
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
    handler: IUniversalHandler,
  ) {
    const publicClient = getPublicClient();
    const { name, address, abi, eventName, args, fromBlock } = config;

    // 1) watchContractEvent if abi + eventName
    if (abi && eventName) {
      // e.g. specialized watchers like nftWatcher
      return publicClient.watchContractEvent({
        address,
        abi,
        eventName,
        args,
        fromBlock,
        onLogs: async (logs) => {
          logger.info(`[${name}] Received ${logs.length} log(s).`);
          for (const singleLog of logs) {
            await this.handleSpecificContractLog(singleLog, eventName, handler);
          }
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
            await handler.onTransactions?.(fullTxs);
          }
        },
        onError: (err) => this.handleWatcherError(err, name),
      });
    }

    // 3) Fallback watchers => default Transfer event
    const defaultEvent = parseAbiItem(
      "event Transfer(address indexed from, address indexed to, uint256 value)",
    );
    return publicClient.watchEvent({
      address,
      event: defaultEvent,
      args,
      fromBlock,
      onLogs: async (logs) => {
        logger.info(`[${name}] Received ${logs.length} fallback log(s).`);
        // We do the batch approach
        await this.handleFallbackTransferLogs(logs, handler);
      },
      onError: (err) => this.handleWatcherError(err, name),
    });
  }

  /**
   * Specialized watchers for "TransferSingle", "TransferBatch", or "Transfer"
   * on a known contract. We know exactly what event it is:
   */
  private async handleSpecificContractLog(
    singleLog: any,
    eventName: string,
    handler: IUniversalHandler,
  ) {
    if (eventName === "TransferSingle") {
      await handler.onERC1155TransferSingle?.([singleLog]);
    } else if (eventName === "TransferBatch") {
      await handler.onERC1155TransferBatch?.([singleLog]);
    } else if (eventName === "Transfer") {
      // Possibly check if singleLog.args.tokenId => ERC721
      if (singleLog.args?.tokenId !== undefined) {
        await handler.onERC721Transfer?.([singleLog]);
      } else {
        await handler.onERC20Transfer?.([singleLog]);
      }
    }
  }

  /**
   * The fallback watchers for "Transfer(...)" logs in a from/to filter.
   * We want to handle *all* token transfers, including unknown NFT or ERC-20.
   *
   * => Steps:
   *   1) Group logs by log.address
   *   2) Multicall to detect if each contract is ERC-20, ERC-721, or ERC-1155
   *   3) Partition logs into arrays: "erc20Logs", "erc721Logs", "erc1155Logs"
   *   4) Call the relevant handler method once per array
   */
  private async handleFallbackTransferLogs(
    allLogs: any[],
    handler: IUniversalHandler,
  ) {
    if (allLogs.length === 0) return;

    // 1) Group logs by contract
    const logsByAddress: Record<string, any[]> = {};
    for (const log of allLogs) {
      const addr = log.address.toLowerCase();
      if (!logsByAddress[addr]) {
        logsByAddress[addr] = [];
      }
      logsByAddress[addr].push(log);
    }

    // 2) Prepare a list of unique addresses
    const uniqueAddresses = Object.keys(logsByAddress).map(
      (a) => a as `0x${string}`,
    );

    // 3) Multicall to get metadata for each contract
    //    (We've presumably created getMultipleTokenMetadataCached in your tokenMetadataCache)
    const metas = await getMultipleTokenMetadataCached(uniqueAddresses);

    // We'll store arrays for each type
    const erc20Array: any[] = [];
    const erc721Array: any[] = [];
    const erc1155singleArray: any[] = []; // For 1155, typically "TransferSingle" or "TransferBatch"
    // But the fallback signature won't catch 1155's default event,
    // so 1155 might not appear here unless the 1155 contract uses a matching "Transfer" event.

    // 4) Partition logs
    for (const [addr, logs] of Object.entries(logsByAddress)) {
      const meta = metas[addr];
      // If the contract is identified as ERC-1155 => put them in erc1155 (though typically they'd not appear in fallback Transfer)
      if (meta.isERC1155) {
        // If "Transfer(...)" is used by some custom 1155, let's treat them as single or batch.
        // You might want a separate approach, but let's do single for the example:
        erc1155singleArray.push(...logs);
        continue;
      }
      // If it's recognized as ERC-721 => push logs to erc721Array
      if (meta.isERC721) {
        erc721Array.push(...logs);
        continue;
      }
      // Otherwise treat as ERC-20
      erc20Array.push(...logs);
    }

    // 5) Call the relevant handler methods
    if (erc20Array.length > 0) {
      await handler.onERC20Transfer?.(erc20Array);
    }
    if (erc721Array.length > 0) {
      await handler.onERC721Transfer?.(erc721Array);
    }
    if (erc1155singleArray.length > 0) {
      // or onERC1155TransferBatch if you want
      await handler.onERC1155TransferSingle?.(erc1155singleArray);
    }
  }

  private handleWatcherError(error: unknown, watcherName: string) {
    logger.error(`[${watcherName}] Watcher error: ${String(error)}`);
    if (this.isReconnecting) return;
    this.isReconnecting = true;
    this.scheduleReconnection();
  }

  private scheduleReconnection() {
    this.reconnectAttempts++;
    const MAX_ATTEMPTS = 10;
    const baseDelayMs = 1000;
    const delay = Math.min(2 ** this.reconnectAttempts * baseDelayMs, 30000);

    if (this.reconnectAttempts > MAX_ATTEMPTS) {
      logger.error(
        "Reached maximum reconnection attempts. Stopping further attempts.",
      );
      return;
    }

    setTimeout(() => {
      this.handleReconnection();
    }, delay);
  }

  private handleReconnection(): void {
    logger.info("Re-initializing viem client & watchers after backoff...");
    resetPublicClient();
    this.isReconnecting = false;
    this.reconnectAttempts = 0;

    for (const [name, stored] of this.watchers) {
      stored.unwatchFn();
      const newUnwatchFn = this.createViemWatcher(
        stored.config,
        stored.handler,
      );
      this.watchers.set(name, { ...stored, unwatchFn: newUnwatchFn });
      logger.info(`Watcher "${name}" re-subscribed successfully.`);
    }
  }
}
