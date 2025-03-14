// src/client.ts

/**
 * Creates and exports a single, reconnecting Public Client (WebSocket).
 * We also expose an event emitter mechanism to notify when a reconnection occurs.
 */

import { createPublicClient, Transport, webSocket } from "viem";
import { EventEmitter } from "node:events";
import { CHAIN, WEBSOCKET_RPC_URL } from "./config";
import { Logger } from "./logger";

// A simple event emitter for custom 'reconnected' or 'closed' events
export const clientEvents = new EventEmitter();

function createWebSocketTransport(): Transport {
  // Return a new transport every time this function is called
  return webSocket(WEBSOCKET_RPC_URL, {
    onOpen: () => {
      Logger.info("WebSocket connected.");
    },
    onError: (error) => {
      Logger.error(`WebSocket error: ${error.message}`);
    },
    onClose: () => {
      Logger.warn("WebSocket connection closed.");
      // Wait a bit, then attempt to reconnect
      setTimeout(() => {
        Logger.info("Attempting to re-create WebSocket transport...");
        // Emit custom "reconnect" event so watchers can re-subscribe
        clientEvents.emit("reconnect");
      }, 3000);
    },
  });
}

export function createViemClient(): ReturnType<typeof createPublicClient> {
  return createPublicClient({
    chain: CHAIN,
    transport: createWebSocketTransport(),
    // We can keep multicall or not, up to you
    batch: {
      multicall: true,
    },
    // Because we are using WebSockets for logs, we typically do not need poll
    // but some providers might require fallback polling.
    pollingInterval: 4_000,
  });
}

// Export a mutable reference to our publicClient
// so we can replace it upon reconnection if needed.
export let publicClient = createViemClient();
