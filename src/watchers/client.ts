// src/watchers/client.ts

/**
 * Exports a single viem Public Client (WebSocket) for all watchers.
 * No custom "onOpen", "onClose", "onError" in the transport config,
 * because viem's WebSocketTransportConfig does not support them.
 *
 * Instead, watchers handle errors at the subscription level
 * and then call "resetPublicClient()" if needed.
 */

import { createPublicClient, Transport, webSocket } from "viem";
import { CHAIN, WEBSOCKET_RPC_URL } from "../config";

let _publicClient = createViemClient();

/**
 * Returns the current Public Client.
 */
export function getPublicClient() {
  return _publicClient;
}

/**
 * Re-creates the Public Client instance. Typically called if watchers decide
 * we need to reconnect after an error.
 */
export function resetPublicClient() {
  _publicClient = createViemClient();
  return _publicClient;
}

/**
 * Creates a viem Public Client with WebSocket transport, no custom "on..." props.
 */
function createViemClient() {
  const transport: Transport = webSocket(WEBSOCKET_RPC_URL, {
    // We only supply standard fields (url, timeout, etc.) if needed,
    // but none of the onXYZ callbacks exist in viem's types.
  });

  return createPublicClient({
    chain: CHAIN,
    transport,
    batch: {
      multicall: true,
    },
    pollingInterval: 4000,
  });
}
