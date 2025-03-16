// src/watchers/index.ts

/**
 * Automatically collects all watchers from this directory,
 * merging them into a single array called ALL_WATCHERS.
 *
 * We avoid using import.meta.url for TS compilation compatibility
 * under CommonJS or Node16 modules.
 * Instead, we rely on __dirname from Node.
 */

import fs from "fs";
import path from "path";
import { IWatcherConfig } from "../types";
import { OptionalClientsManager } from "../clients/optionalClientsManager";

/**
 * A type for watchers that each file exports.
 */
interface IWatcherDefinition {
  config: IWatcherConfig;
  createHandler: (clients: OptionalClientsManager) => any;
}

/**
 * The watchersDir is the current directory (__dirname).
 */
const watchersDir = __dirname;

/**
 * We'll gather watchers from all *.ts files that export "WATCHERS".
 */
const watchers: IWatcherDefinition[] = [];

// Read all files in watchers folder
const files = fs.readdirSync(watchersDir);

for (const file of files) {
  // We skip index.ts, client.ts, watcherManager.ts, or non-ts files
  if (
    file === "index.ts" ||
    file === "client.ts" ||
    file === "watcherManager.ts" ||
    !file.endsWith(".ts")
  ) {
    continue;
  }

  const fullPath = path.join(watchersDir, file);
  // Use require(...) if you're compiling to CommonJS
  const module = require(fullPath);

  // If the module exports WATCHERS, we merge them in
  if (module.WATCHERS && Array.isArray(module.WATCHERS)) {
    watchers.push(...module.WATCHERS);
  }
}

export const ALL_WATCHERS = watchers;
