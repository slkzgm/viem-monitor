# VIEM-MONITOR

## Overview

This repository implements a **Web3 Event & Wallet Monitoring** service using [**viem**](https://viem.sh/) for Ethereum. It monitors events (like ERC20 or NFT transfers) **and** normal wallet transactions (EOA addresses). When a relevant activity is found, custom **handlers** execute your logic—logging, storing info, posting alerts to Discord/Telegram/Twitter, etc.

### Key Features

- **Single Reconnecting WS Client**  
  Automatic reconnection with exponential backoff (no manual restarts needed).
- **Modular Watchers**  
  Each contract or wallet domain can have its own file in `src/watchers/`, discovered automatically.
- **Optional Clients**  
  Easily enable/disable Discord, Telegram, or Twitter.
- **Graceful Shutdown**  
  Stops watchers and clients on exit.
- **Pino Logging**  
  Fast JSON logs in production, optional pretty logs in dev.

## Installation & Setup

### Requirements

- Node.js (v16+)
- pnpm (or npm/yarn)
- A valid WebSocket RPC (Infura, Alchemy, etc.)
- Optional dependencies if you want to enable Discord/Telegram/Twitter

### Steps

1. **Clone & Install**

   ```bash
   git clone https://github.com/slkzgm/viem-monitor.git
   cd viem-monitor
   pnpm install
   ```

2. **Configure**

   - Copy `.env.example` to `.env`, fill in your **WEBSOCKET_RPC_URL**, toggle any optional integrations, etc.

3. **Run**
   - **Development**:
     ```bash
     pnpm dev
     ```
   - **Production**:
     ```bash
     pnpm build
     pnpm start
     ```

## Adding Watchers & Handlers

1. **Create a Handler** (in `src/handlers/`):

   ```ts
   import { IEventHandler } from "../types";
   import { createPrefixedLogger } from "../logger/logger";

   export class MyCustomHandler implements IEventHandler {
     private log = createPrefixedLogger("MyCustomHandler");

     public async handleEvent(logs: any[]): Promise<void> {
       for (const log of logs) {
         this.log.info(`Handling log: ${JSON.stringify(log)}`);
         // your logic...
       }
     }
   }
   ```

2. **Create a Watcher** (in `src/watchers/`), for example a contract:

   ```ts
   import { OptionalClientsManager } from "../clients/optionalClientsManager";
   import { MyCustomHandler } from "../handlers/myCustomHandler";

   export const WATCHERS = [
     {
       config: {
         name: "MyContract_Watcher",
         address: "0xYourContractAddress",
         abi: [
           /* your event ABI */
         ],
         eventName: "MyEvent",
       },
       createHandler: (clients: OptionalClientsManager) => {
         return new MyCustomHandler();
       },
     },
   ];
   ```

   **Done!** The aggregator in `src/watchers/index.ts` picks it up, and your new watcher is **active** at startup.

### Monitoring Wallets

If you want to monitor EOA addresses (e.g., track ETH transactions to/from a wallet):

- **`walletActivityWatcher.ts`** defines `AllWallets_Activity_Watcher`, scanning each block’s transactions.
- You simply add new addresses to `MONITORED_WALLETS`, each with a `direction` (“from”, “to”, or “both”) and a custom sub-handler.

## Optional Clients

Enable or disable **Discord**, **Telegram**, or **Twitter** in `.env`:

```bash
NODE_ENV=""

ENABLE_DISCORD="true"
DISCORD_TOKEN="..."
DISCORD_DEFAULT_CHANNEL_ID="..."

ENABLE_TELEGRAM="false"
TELEGRAM_TOKEN="..."
TELEGRAM_DEFAULT_CHANNEL_ID="..."

ENABLE_TWITTER="false"
TWITTER_USERNAME="..."
TWITTER_PASSWORD="..."
```

Only enabled clients are initialized.

## Logging

- Uses [Pino](https://github.com/pinojs/pino).
- Logs are **JSON** by default for production.
- In dev (`NODE_ENV=development`), logs are pretty-printed with `pino-pretty`.

## Graceful Shutdown

When you `Ctrl + C` (SIGINT) or send SIGTERM:

1. All watchers unsubscribe (`removeAllWatchers()`).
2. Optional clients disconnect (e.g., `discordClient.destroy()`).
3. Process exits cleanly.

---

**Enjoy your Web3 Event & Wallet Monitoring!** If you have suggestions or improvements, feel free to fork or open an issue.
