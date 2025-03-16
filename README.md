# README

## 1. Project Overview

This repository implements a **Web3 Event Monitoring** service using [**viem**](https://viem.sh/) for Ethereum blockchain interactions. The code monitors on-chain events (e.g., ERC20 transfers, NFT transfers) in **real time** using a **single** `publicClient` with **WebSocket** + **exponential backoff** reconnection. When events are detected, **handlers** execute custom logic—logging, storing info in DB, sending alerts, posting on Discord/Telegram/Twitter, etc.

## 2. Key Features

- **Single Reconnecting WebSocket Client**  
  Automatically reconnects on socket closure, using exponential backoff.
- **Modular Watchers**  
  Each contract or domain can define watchers in separate files (`erc20Watcher.ts`, `nftWatcher.ts`, etc.).
- **Auto-Discovery of Watchers**  
  A mechanism automatically loads watchers from the `src/watchers/` folder, so you only have to create a new file for a new watcher—no manual imports needed.
- **Optional Integrations**  
  Configure Discord, Telegram, Twitter, or no external integrations at all.
- **Graceful Shutdown**  
  Catches OS signals (SIGINT/SIGTERM), stops watchers, and closes clients cleanly.

## 3. Installation & Setup

### 3.1 Requirements

- **Node.js** (v16+ recommended)
- **pnpm** (or npm/yarn if you prefer—adjust the commands accordingly)
- A **WebSocket RPC** endpoint (e.g., Infura, Alchemy, your own node)
- Optional dependencies installed if you want to use Discord/Telegram/Twitter integrations

### 3.2 Cloning & Installing

```bash
git clone <your-project-repo>.git
cd viem-monitor
pnpm install
```

> If you prefer, you can replace `pnpm install` with `npm install` or `yarn install`—just be consistent.

### 3.3 Configuration (.env)

All environment variables are loaded from `.env` by default (using `dotenv`). Below is an example `.env.example` file. Rename it to `.env` (or copy its contents) and fill out your own credentials:

```bash
# .env.example

# --- WebSocket RPC ---
WEBSOCKET_RPC_URL="wss://mainnet.infura.io/ws/v3/YOUR_INFURA_KEY"

# --- Discord ---
ENABLE_DISCORD="false"
DISCORD_TOKEN=""
DISCORD_DEFAULT_CHANNEL_ID=""

# --- Telegram ---
ENABLE_TELEGRAM="false"
TELEGRAM_TOKEN=""
TELEGRAM_DEFAULT_CHANNEL_ID=""

# --- Twitter ---
ENABLE_TWITTER="false"
TWITTER_USERNAME=""
TWITTER_PASSWORD=""
TWITTER_EMAIL=""
```

| Variable                        | Description                                            |
| ------------------------------- | ------------------------------------------------------ |
| **WEBSOCKET_RPC_URL**           | Your WebSocket provider’s URL (Infura, Alchemy, etc.). |
| **ENABLE_DISCORD**              | "true"/"false" toggles Discord integration.            |
| **DISCORD_TOKEN**               | Your Discord bot token.                                |
| **DISCORD_DEFAULT_CHANNEL_ID**  | Channel ID where messages will be posted.              |
| **ENABLE_TELEGRAM**             | "true"/"false" toggles Telegram integration.           |
| **TELEGRAM_TOKEN**              | Bot token from @BotFather.                             |
| **TELEGRAM_DEFAULT_CHANNEL_ID** | Chat/group ID where messages will be posted.           |
| **ENABLE_TWITTER**              | "true"/"false" toggles Twitter integration.            |
| **TWITTER_USERNAME**            | Twitter username for `agent-twitter-client`.           |
| **TWITTER_PASSWORD**            | Twitter password.                                      |
| **TWITTER_EMAIL**               | (Optional) Email if the client library requires it.    |

> **Note**: If you do not enable a client, you do **not** need to install its optional dependency or fill out its environment variables.

## 4. Folder Structure

```plaintext
.
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
└── src
    ├── clients
    │   ├── discordClient.ts         # Discord integration (dynamic import)
    │   ├── optionalClientsManager.ts# Orchestrates optional clients (Discord, Telegram, Twitter)
    │   ├── telegramClient.ts        # Telegram integration
    │   └── twitterClient.ts         # Twitter integration
    ├── config
    │   └── index.ts                 # Environment variable parsing & chain config
    ├── handlers
    │   ├── erc20Handler.ts          # Example handler for ERC20 Transfer
    │   └── nftHandler.ts            # Example handler for NFT Transfer
    ├── index.ts                     # Main entry point, sets up watchers & graceful shutdown
    ├── logger
    │   └── logger.ts               # Simple logger with info/warn/error
    ├── types.ts                     # Shared TypeScript interfaces
    └── watchers
        ├── client.ts               # viem WebSocket client with exponential backoff
        ├── watcherManager.ts       # Manages watchers, re-subscribes on reconnect
        ├── index.ts                # Automatically loads watchers from this folder
        ├── erc20Watcher.ts         # Example watchers for ERC20
        └── nftWatcher.ts           # Example watchers for NFT
```

### Key Points

- **`src/index.ts`** is the main entry. It initializes watchers, optional clients, and handles shutdown.
- **`watchers/`** has:
  - **`index.ts`**: merges watchers from all `.ts` files except `client.ts`, `watcherManager.ts`, and itself.
  - **`client.ts`**: creates a single **`publicClient`** with WS transport + exponential backoff.
  - **`watcherManager.ts`**: logic to add/remove watchers, re-subscribe on reconnect.
  - **`erc20Watcher.ts`** / **`nftWatcher.ts`**: define watchers for specific domains or contracts.
- **`handlers/`** contains logic that processes logs, e.g. posting to social media or storing in DB.
- **`clients/`** hosts dynamic import wrappers for Telegram, Discord, Twitter (only loaded if enabled).

## 5. How to Run

1. **Development** (with `ts-node` or `tsx`):
   ```bash
   pnpm dev
   ```
   If you prefer `npm`:
   ```bash
   npm run dev
   ```
2. **Production Build**:
   ```bash
   pnpm build
   ```
   Then run:
   ```bash
   pnpm start
   ```
   (Which executes the compiled JS from `dist/`.)

## 6. Optional Clients & Configuration

Your `.env` determines whether **Discord**, **Telegram**, or **Twitter** is enabled:

- **Discord**: `ENABLE_DISCORD="true"`, and supply `DISCORD_TOKEN` + `DISCORD_DEFAULT_CHANNEL_ID`.
- **Telegram**: `ENABLE_TELEGRAM="true"`, and supply `TELEGRAM_TOKEN` + `TELEGRAM_DEFAULT_CHANNEL_ID`.
- **Twitter**: `ENABLE_TWITTER="true"`, and supply `TWITTER_USERNAME`, `TWITTER_PASSWORD`, and possibly `TWITTER_EMAIL` if needed.

If any client is disabled, the code **will not** import its library (e.g., `discord.js`). This prevents you from installing unnecessary packages.

### Broadcasting a Test Message

In `src/index.ts`, after the watchers are set up, we do:

```ts
await optionalClients.broadcastMessage("Hello from watchers!");
```

This sends a **test** message to **all** enabled clients (Discord, Telegram, Twitter).

## 7. Adding New Watchers & Handlers

### 7.1 Creating a New Handler

A **handler** is a class implementing `IEventHandler`:

```ts
import { IEventHandler } from "../types";
import { Logger } from "../logger/logger";

export class MyNewHandler implements IEventHandler {
  public async handleEvent(logs: any[]): Promise<void> {
    for (const log of logs) {
      Logger.info("MyNewHandler processing log:", log);
      // custom logic...
    }
  }
}
```

### 7.2 Adding a New Watcher

Create a new file in `src/watchers`, e.g. `myCustomWatcher.ts`:

```ts
import { OptionalClientsManager } from "../clients/optionalClientsManager"
import { MyNewHandler } from "../handlers/myNewHandler"

/**
 * If your event requires an ABI, define it here or import it.
 */
const someAbi = [
  {
    type: "event",
    name: "MyEvent",
    inputs: [...],
  },
]

// The aggregator in watchers/index.ts will read this:
export const WATCHERS = [
  {
    config: {
      name: "MyCustom_Watcher",
      address: "0xYourContractAddress",
      abi: someAbi,
      eventName: "MyEvent",
      // optionally, args or fromBlock
    },
    createHandler: (clients: OptionalClientsManager) => {
      return new MyNewHandler()
    },
  },
]
```

**Done.** The `watchers/index.ts` automatically picks up this file and merges it into `ALL_WATCHERS`, so your new watcher is live at startup—**no** additional import needed.

## 8. Graceful Shutdown

When you press `Ctrl + C` or send a kill signal, `src/index.ts` triggers:

1. `watcherManager.removeAllWatchers()` – unsubscribes from events.
2. Closes/disconnects optional clients (e.g., calls `discordClient.destroy()`).
3. Logs exit and calls `process.exit(0)`.

This ensures no watchers remain half-active and that resources are released properly.

## 9. Further Customization

- **Database Integration**: In your handlers, you can insert logs into a database (e.g., PostgreSQL, Mongo) or call external APIs.
- **Exponential Backoff** Tuning: Adjust `MAX_ATTEMPTS` or the base delay in `client.ts`.
- **ABIs**: You can define them inline or import them from JSON files.
- **Multiple Chains**: If you want to watch multiple networks, you can create multiple `publicClient`s or watchers pointing to different RPC URLs.
- **Logging**: Currently simple `console` logs. You may integrate something like [Winston](https://github.com/winstonjs/winston) or [Pino](https://getpino.io/) for advanced logging.

---

## Conclusion

This template offers a **production-ready**, **event-driven** system with:

- **One** stable `publicClient` for all watchers
- Easy watchers & handler creation
- Automatic reconnection & optional integrations

Feel free to **fork** or **clone** it, adapt to your chain or environment, and collaborate easily with a clear file structure. If you have questions or suggestions, open an issue or contribute directly!

Enjoy your **Web3 Event Monitoring**!

---

**Thank you for using this template!** If you find improvements, send a PR or share your feedback.
