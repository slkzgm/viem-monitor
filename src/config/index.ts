// src/config/index.ts

/**
 * This file handles environment variables, chain setup, and optional client flags.
 */

import "dotenv/config";
import { abstract } from "viem/chains";

// CHAIN & RPC
export const CHAIN = abstract;
export const WEBSOCKET_RPC_URL =
  process.env.WEBSOCKET_RPC_URL || "wss://api.mainnet.abs.xyz/ws";

// DISCORD
export const ENABLE_DISCORD = process.env.ENABLE_DISCORD === "true";
export const DISCORD_TOKEN = process.env.DISCORD_TOKEN || "";
export const DISCORD_FALLBACK_CHANNEL_ID =
  process.env.DISCORD_FALLBACK_CHANNEL_ID || "";

// TELEGRAM
export const ENABLE_TELEGRAM = process.env.ENABLE_TELEGRAM === "true";
export const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || "";
export const TELEGRAM_FALLBACK_CHANNEL_ID =
  process.env.TELEGRAM_FALLBACK_CHANNEL_ID || "";

// TWITTER
export const ENABLE_TWITTER = process.env.ENABLE_TWITTER === "true";
export const TWITTER_USERNAME = process.env.TWITTER_USERNAME || "";
export const TWITTER_PASSWORD = process.env.TWITTER_PASSWORD || "";
export const TWITTER_EMAIL = process.env.TWITTER_EMAIL || "";
