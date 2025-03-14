// src/index.ts

/**
 * Main entry point. Initializes watchers (like in previous examples)
 * and also initializes optional external clients.
 */

import { Logger } from './logger'
import { WatcherManager } from './watcherManager'
import { TransferHandler } from './handlers/transferHandler'
import { IWatcherConfig } from './types'
import { OptionalClientsManager } from './optionalClientsManager'

async function main() {
  Logger.info('Starting application...')

  // 1) Initialize watchers (from your previous setup)
  const watcherManager = new WatcherManager()

  const transferWatcherConfig: IWatcherConfig = {
    name: 'ERC20_Transfer_Watcher',
    address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    // ...
  }
  watcherManager.addWatcher(transferWatcherConfig, new TransferHandler())

  // 2) Initialize optional clients
  const optionalClients = new OptionalClientsManager()
  await optionalClients.initAll()

  // 3) Try sending a test broadcast
  await optionalClients.broadcastMessage('Hello from the watchers!')

  Logger.info('App initialization complete.')
}

main().catch((error) => {
  Logger.error(`Fatal error in main: ${error.message}`)
  process.exit(1)
})
