// src/services/tokenMetadataCache.ts

/**
 * A global cache to store & retrieve token metadata (e.g. name, symbol, decimals)
 * for ERC-20, ERC-721, and ERC-1155. We use viem's multicall to minimize RPC calls.
 * All logs/comments in English only, code is production-ready & safe.
 *
 * This version is updated to fix TypeScript issues:
 * - We define ABI objects with the proper structure (including "inputs" & "outputs")
 * - We use type-checks or casts for "result" fields to avoid "unknown is not assignable to string"
 */

import { Abi } from "viem"; // We assume you have viem installed
import { logger } from "../logger/logger";
import { getPublicClient } from "../watchers/client";

/**
 * Minimal typed ABIs for the calls we need:
 */
const ERC165_ABI: Abi = [
  {
    type: "function",
    name: "supportsInterface",
    stateMutability: "view",
    inputs: [{ name: "interfaceId", type: "bytes4" }],
    outputs: [{ type: "bool" }],
  },
];

const COMMON_ABI: Abi = [
  {
    type: "function",
    name: "name",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
];

const ERC20_ABI: Abi = [
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint8" }],
  },
];

/**
 * A structure that holds essential token info. Extend as needed
 * (e.g., for contract URIs, totalSupply, etc.).
 */
export interface TokenMetadata {
  name: string; // e.g., "USD Coin" or "CoolNFT"
  symbol: string; // e.g., "USDC" or "COOL"
  decimals?: number; // For ERC-20. If not applicable, undefined.
  isERC721?: boolean; // True if supports ERC721
  isERC1155?: boolean; // True if supports ERC1155
}

/**
 * An in-memory cache. Key = contract address in lowercase, value = metadata.
 */
const tokenCache: Record<string, TokenMetadata> = {};

/**
 * Fetches metadata from the cache or, if missing, calls `fetchTokenMetadata()`.
 */
export async function getTokenMetadataCached(
  contractAddress: `0x${string}`,
): Promise<TokenMetadata> {
  const lowerAddr = contractAddress.toLowerCase();
  if (tokenCache[lowerAddr]) {
    return tokenCache[lowerAddr];
  }
  const meta = await fetchTokenMetadata(lowerAddr as `0x${string}`);
  tokenCache[lowerAddr] = meta;
  return meta;
}

/**
 * If you have multiple addresses to fetch at once, call this for a batch operation.
 * This function returns the metadata for each address and updates the cache.
 */
export async function getMultipleTokenMetadataCached(
  addresses: `0x${string}`[],
): Promise<Record<string, TokenMetadata>> {
  const results: Record<string, TokenMetadata> = {};
  const addressesToFetch: `0x${string}`[] = [];

  for (const addr of addresses) {
    const lower = addr.toLowerCase();
    if (tokenCache[lower]) {
      // Already cached
      results[lower] = tokenCache[lower];
    } else {
      addressesToFetch.push(lower as `0x${string}`);
    }
  }

  if (addressesToFetch.length > 0) {
    logger.debug(
      `Fetching token metadata for ${addressesToFetch.length} new addresses via multicall...`,
    );
    const newMeta = await fetchMultipleTokenMetadata(addressesToFetch);
    for (const [addr, meta] of Object.entries(newMeta)) {
      tokenCache[addr] = meta;
      results[addr] = meta;
    }
  }

  return results;
}

/**
 * For a single address, we do a multicall with up to 5 subcalls:
 *   1) supportsInterface(0x80ac58cd) => check if ERC-721
 *   2) supportsInterface(0xd9b67a26) => check if ERC-1155
 *   3) name()
 *   4) symbol()
 *   5) decimals() (ERC-20 only, might revert for NFTs)
 */
async function fetchTokenMetadata(
  contractAddress: `0x${string}`,
): Promise<TokenMetadata> {
  const publicClient = getPublicClient();
  const calls = [
    {
      address: contractAddress,
      abi: ERC165_ABI,
      functionName: "supportsInterface",
      args: ["0x80ac58cd"], // ERC-721
    },
    {
      address: contractAddress,
      abi: ERC165_ABI,
      functionName: "supportsInterface",
      args: ["0xd9b67a26"], // ERC-1155
    },
    {
      address: contractAddress,
      abi: COMMON_ABI,
      functionName: "name",
    },
    {
      address: contractAddress,
      abi: COMMON_ABI,
      functionName: "symbol",
    },
    {
      address: contractAddress,
      abi: ERC20_ABI,
      functionName: "decimals",
    },
  ];

  const responses = await publicClient.multicall({
    contracts: calls,
    allowFailure: true,
  });

  let is721 = false;
  let is1155 = false;
  let name: string = "Unknown";
  let symbol: string = "???";
  let decimals: number | undefined = undefined;

  // 0: supportsInterface(0x80ac58cd) => ERC-721
  if (responses[0].status === "success") {
    // TS sees "result" as unknown. We expect boolean. We'll do a safe cast:
    if (responses[0].result === true) {
      is721 = true;
    }
  }

  // 1: supportsInterface(0xd9b67a26) => ERC-1155
  if (responses[1].status === "success") {
    if (responses[1].result === true) {
      is1155 = true;
    }
  }

  // 2: name()
  if (responses[2].status === "success") {
    const rawName = responses[2].result; // unknown
    if (typeof rawName === "string") {
      name = rawName;
    }
  }

  // 3: symbol()
  if (responses[3].status === "success") {
    const rawSymbol = responses[3].result; // unknown
    if (typeof rawSymbol === "string") {
      symbol = rawSymbol;
    }
  }

  // 4: decimals()
  if (responses[4].status === "success") {
    const rawDec = responses[4].result; // unknown
    if (typeof rawDec === "bigint") {
      decimals = Number(rawDec);
    } else if (typeof rawDec === "number") {
      decimals = rawDec;
    }
  }

  const meta: TokenMetadata = {
    name,
    symbol,
    decimals,
    isERC721: is721,
    isERC1155: is1155,
  };

  logger.debug(
    `Fetched token metadata for ${contractAddress}: name=${meta.name}, symbol=${meta.symbol}, decimals=${meta.decimals}, is721=${is721}, is1155=${is1155}`,
  );

  return meta;
}

/**
 * A multicall-based function that fetches metadata for multiple addresses in one call.
 * We do the same 5 calls per address. We parse them in groups of 5.
 */
async function fetchMultipleTokenMetadata(
  addresses: `0x${string}`[],
): Promise<Record<string, TokenMetadata>> {
  const publicClient = getPublicClient();

  // We'll form an array of length = addresses.length * 5 calls
  const calls = [];
  for (const addr of addresses) {
    calls.push({
      address: addr,
      abi: ERC165_ABI,
      functionName: "supportsInterface",
      args: ["0x80ac58cd"], // ERC-721
    });
    calls.push({
      address: addr,
      abi: ERC165_ABI,
      functionName: "supportsInterface",
      args: ["0xd9b67a26"], // ERC-1155
    });
    calls.push({
      address: addr,
      abi: COMMON_ABI,
      functionName: "name",
    });
    calls.push({
      address: addr,
      abi: COMMON_ABI,
      functionName: "symbol",
    });
    calls.push({
      address: addr,
      abi: ERC20_ABI,
      functionName: "decimals",
    });
  }

  const responses = await publicClient.multicall({
    contracts: calls,
    allowFailure: true,
  });

  const result: Record<string, TokenMetadata> = {};
  let callIndex = 0;

  for (const addr of addresses) {
    let is721 = false;
    let is1155 = false;
    let name: string = "Unknown";
    let symbol: string = "???";
    let decimals: number | undefined = undefined;

    // 1) supportsInterface(ERC-721)
    if (responses[callIndex].status === "success") {
      if (responses[callIndex].result === true) {
        is721 = true;
      }
    }
    callIndex++;

    // 2) supportsInterface(ERC-1155)
    if (responses[callIndex].status === "success") {
      if (responses[callIndex].result === true) {
        is1155 = true;
      }
    }
    callIndex++;

    // 3) name()
    if (responses[callIndex].status === "success") {
      const rawName = responses[callIndex].result;
      if (typeof rawName === "string") {
        name = rawName;
      }
    }
    callIndex++;

    // 4) symbol()
    if (responses[callIndex].status === "success") {
      const rawSymbol = responses[callIndex].result;
      if (typeof rawSymbol === "string") {
        symbol = rawSymbol;
      }
    }
    callIndex++;

    // 5) decimals()
    if (responses[callIndex].status === "success") {
      const rawDec = responses[callIndex].result;
      if (typeof rawDec === "bigint") {
        decimals = Number(rawDec);
      } else if (typeof rawDec === "number") {
        decimals = rawDec;
      }
    }
    callIndex++;

    result[addr.toLowerCase()] = {
      name,
      symbol,
      decimals,
      isERC721: is721,
      isERC1155: is1155,
    };
  }

  return result;
}
