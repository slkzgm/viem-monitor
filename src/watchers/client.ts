// src/watchers/client.ts

/**
 * Exports a single viem Public Client (WebSocket) for all watchers.
 * No custom "onOpen"/"onClose"/"onError" in the config because viem's
 * WebSocketTransportConfig does not support them.
 */

import { createPublicClient, Transport, webSocket } from "viem";
import { CHAIN, WEBSOCKET_RPC_URL } from "../config";

let _publicClient = createViemClient();

export function getPublicClient() {
  return _publicClient;
}

export function resetPublicClient() {
  _publicClient = createViemClient();
  return _publicClient;
}

function createViemClient() {
  const transport: Transport = webSocket(WEBSOCKET_RPC_URL, {
    // We only supply standard fields, no onXYZ props
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
