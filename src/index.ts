// src/index.ts

/**
 * Main entry point.
 * Initializes watchers, optional clients, and sets up graceful shutdown.
 */

import { logger } from "./logger/logger";
import { WatcherManager } from "./watchers/watcherManager";
import { OptionalClientsManager } from "./clients/optionalClientsManager";
import { ALL_WATCHERS } from "./watchers";

let watcherManager: WatcherManager;
let optionalClients: OptionalClientsManager;

async function main() {
  logger.info("Starting application...");

  watcherManager = new WatcherManager();
  optionalClients = new OptionalClientsManager();
  await optionalClients.initAll();

  // For each definition in ALL_WATCHERS, create the handler and add the watcher
  for (const definition of ALL_WATCHERS) {
    const handlerInstance = definition.createHandler(optionalClients);
    watcherManager.addWatcher(definition.config, handlerInstance);
  }

  logger.info("All watchers registered. Testing broadcast...");
  await optionalClients.broadcastMessage("Hello from watchers!");

  logger.info("App initialization complete.");
}

/**
 * Graceful shutdown logic.
 */
async function shutdownHandler(signal: string) {
  logger.warn(`Received ${signal}. Starting graceful shutdown...`);

  try {
    if (watcherManager) {
      watcherManager.removeAllWatchers();
      logger.info("All watchers removed successfully.");
    }

    if (optionalClients) {
      if (optionalClients.discordClient?.destroy) {
        optionalClients.discordClient.destroy();
        logger.info("Discord client destroyed.");
      }
      // Additional teardown for Telegram/Twitter if needed
    }

    logger.info("Shutdown complete. Exiting process now.");
    process.exit(0);
  } catch (error: any) {
    logger.error(`Error during shutdown: ${error.message}`);
    process.exit(1);
  }
}

// Setup signal handlers for graceful shutdown
process.on("SIGINT", () => shutdownHandler("SIGINT"));
process.on("SIGTERM", () => shutdownHandler("SIGTERM"));

main().catch((error) => {
  logger.error(`Fatal error in main: ${error.message}`);
  process.exit(1);
});
