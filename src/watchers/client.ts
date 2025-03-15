// src/watchers/client.ts

/**
 * Creates and exports a single, reconnecting Public Client (WebSocket).
 * Now with exponential backoff for reconnection, plus error.code logging.
 */

import { createPublicClient, Transport, webSocket } from "viem";
import { EventEmitter } from "node:events";
import { Logger } from "../logger/logger";
import { CHAIN, WEBSOCKET_RPC_URL } from "../config";

export const clientEvents = new EventEmitter();

// Track reconnection attempts to implement exponential backoff
let reconnectAttempts = 0;

function createWebSocketTransport(): Transport {
  return webSocket(WEBSOCKET_RPC_URL, {
    onOpen: () => {
      reconnectAttempts = 0; // Reset attempts on successful open
      Logger.info("WebSocket connected.");
    },
    onError: (error) => {
      // Log error message + code if available
      const codeInfo = (error as any).code
        ? ` Code: ${(error as any).code}`
        : "";
      Logger.error(`WebSocket error: ${error.message}${codeInfo}`);
    },
    onClose: () => {
      Logger.warn("WebSocket connection closed.");
      // Trigger a backoff-based reconnect
      scheduleReconnection();
    },
  });
}

/**
 * Example exponential backoff:
 * First attempt: wait 2^0 * 1s = 1s
 * Second: 2^1 * 1s = 2s
 * Third: 2^2 * 1s = 4s
 * etc... up to a max.
 */
function scheduleReconnection(): void {
  reconnectAttempts++;
  const MAX_ATTEMPTS = 10;
  const baseDelayMs = 1000;
  const delay = Math.min(Math.pow(2, reconnectAttempts) * baseDelayMs, 30000); // clamp at 30s max

  if (reconnectAttempts > MAX_ATTEMPTS) {
    Logger.error(
      "Reached maximum reconnection attempts. Will not reconnect further.",
    );
    return;
  }

  setTimeout(() => {
    Logger.info(
      `Attempting to re-create WebSocket transport (attempt #${reconnectAttempts})...`,
    );
    clientEvents.emit("reconnect");
  }, delay);
}

export function createViemClient() {
  return createPublicClient({
    chain: CHAIN,
    transport: createWebSocketTransport(),
    batch: {
      multicall: true,
    },
    // Typically not needed for WS, but you can keep if your provider or
    // fallback logic requires it.
    pollingInterval: 4000,
  });
}

export let publicClient = createViemClient();
