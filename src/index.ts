// src/index.ts

/**
 * Main entry point.
 * Initializes watchers, optional clients, and sets up graceful shutdown.
 */

import { Logger } from "./logger/logger";
import { WatcherManager } from "./watchers/watcherManager";
import { TransferHandler } from "./handlers/transferHandler";
import { IWatcherConfig } from "./types";
import { OptionalClientsManager } from "./clients/optionalClientsManager";

// Create watchers & optional clients at module scope so we can shut them down
let watcherManager: WatcherManager;
let optionalClients: OptionalClientsManager;

async function main() {
  Logger.info("Starting application...");

  // 1) Initialize watchers
  watcherManager = new WatcherManager();

  const transferWatcherConfig: IWatcherConfig = {
    name: "ERC20_Transfer_Watcher",
    address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    // ...
  };
  watcherManager.addWatcher(transferWatcherConfig, new TransferHandler());

  // 2) Initialize optional clients
  optionalClients = new OptionalClientsManager();
  await optionalClients.initAll();

  // 3) Test broadcast
  await optionalClients.broadcastMessage("Hello from the watchers!");

  Logger.info("App initialization complete.");
}

/**
 * Graceful shutdown:
 * Called when we receive SIGINT / SIGTERM or process.exit is triggered with code.
 */
async function shutdownHandler(signal: string) {
  Logger.warn(`Received ${signal}. Starting graceful shutdown...`);

  try {
    // 1) Remove watchers
    if (watcherManager) {
      watcherManager.removeAllWatchers();
      Logger.info("All watchers removed successfully.");
    }

    // 2) Optionally close or destroy external clients if needed
    if (optionalClients) {
      // Example: if your Discord client has a "destroy" or "logout"
      if (optionalClients.discordClient?.destroy) {
        optionalClients.discordClient.destroy();
        Logger.info("Discord client destroyed.");
      }
      // Telegram client might need a stopPolling or something similar
      // Twitter client might need an explicit close
    }

    // 3) Wait a bit if needed for in-flight operations
    Logger.info("Shutdown complete. Exiting process now.");
    process.exit(0);
  } catch (error: any) {
    Logger.error(`Error during shutdown: ${error.message}`);
    process.exit(1);
  }
}

// Setup signal handlers for graceful shutdown
process.on("SIGINT", () => shutdownHandler("SIGINT"));
process.on("SIGTERM", () => shutdownHandler("SIGTERM"));

// Start the app
main().catch((error) => {
  Logger.error(`Fatal error in main: ${error.message}`);
  process.exit(1);
});
