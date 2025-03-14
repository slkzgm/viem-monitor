// src/config.ts

/**
 * This file handles all configuration parameters such as the chain,
 * RPC URLs, or environment variables for the application.
 */

import 'dotenv/config'
import { abstract } from "viem/chains";

export const CHAIN = abstract;
export const WEBSOCKET_RPC_URL =
  process.env.WEBSOCKET_RPC_URL || "wss://api.mainnet.abs.xyz/ws";

/**
 * Configuration flags for optional clients.
 * You can define them in environment variables (or another config system).
 */
export const ENABLE_DISCORD = process.env.ENABLE_DISCORD === 'true'
export const ENABLE_TELEGRAM = process.env.ENABLE_TELEGRAM === 'true'
export const ENABLE_TWITTER = process.env.ENABLE_TWITTER === 'true'

// Twitter credentials
export const TWITTER_USERNAME = process.env.TWITTER_USERNAME || ''
export const TWITTER_PASSWORD = process.env.TWITTER_PASSWORD || ''
