// src/index.ts

/**
 * Main entry point.
 * Initializes watchers, optional clients, and sets up graceful shutdown.
 */

import { Logger } from "./logger/logger";
import { WatcherManager } from "./watchers/watcherManager";
import { OptionalClientsManager } from "./clients/optionalClientsManager";
import { ALL_WATCHERS } from "./watchers";

let watcherManager: WatcherManager;
let optionalClients: OptionalClientsManager;

async function main() {
  Logger.info("Starting application...");

  watcherManager = new WatcherManager();
  optionalClients = new OptionalClientsManager();
  await optionalClients.initAll();

  // For each definition in ALL_WATCHERS, create the handler and add the watcher
  for (const definition of ALL_WATCHERS) {
    const handlerInstance = definition.createHandler(optionalClients);
    watcherManager.addWatcher(definition.config, handlerInstance);
  }

  Logger.info("All watchers registered. Testing broadcast...");
  await optionalClients.broadcastMessage("Hello from watchers!");

  Logger.info("App initialization complete.");
}

/**
 * Graceful shutdown logic (same as your current code).
 */
async function shutdownHandler(signal: string) {
  Logger.warn(`Received ${signal}. Starting graceful shutdown...`);

  try {
    if (watcherManager) {
      watcherManager.removeAllWatchers();
      Logger.info("All watchers removed successfully.");
    }

    if (optionalClients) {
      if (optionalClients.discordClient?.destroy) {
        optionalClients.discordClient.destroy();
        Logger.info("Discord client destroyed.");
      }
      // Additional teardown for Telegram/Twitter if needed
    }

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

main().catch((error) => {
  Logger.error(`Fatal error in main: ${error.message}`);
  process.exit(1);
});
