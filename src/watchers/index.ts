// src/watchers/index.ts

/**
 * Automatically collects all watchers from this directory,
 * merging them into a single array called ALL_WATCHERS.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { IWatcherConfig } from "../types";
import { OptionalClientsManager } from "../clients/optionalClientsManager";

/**
 * We define a type for the structure each file exports:
 */
interface IWatcherDefinition {
  config: IWatcherConfig;
  createHandler: (clients: OptionalClientsManager) => any;
}

/**
 * We will gather watchers from all *.ts files in this folder
 * that export a constant named "WATCHERS".
 */

// In case we use ESM, we get the __dirname from fileURLToPath:
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Final array of watchers
const watchers: IWatcherDefinition[] = [];

// Read all files in the watchers folder
const files = fs.readdirSync(__dirname);

// For each file, if it is not "index.ts" and not "client.ts" or "watcherManager.ts",
// we require/import it and push watchers into the array.
for (const file of files) {
  // Skip if the file is index.ts, client.ts, or watcherManager.ts, or not a TS file
  if (
    file === "index.ts" ||
    file === "client.ts" ||
    file === "watcherManager.ts" ||
    !file.endsWith(".ts")
  ) {
    continue;
  }

  const fullPath = path.join(__dirname, file);
  // Use require if you're in a Node environment with CommonJS transpile,
  // or dynamic import if in ESM. Here is an example with require:
  // (If you have trouble with ESM, adjust accordingly.)

  const module = require(fullPath);

  // If the module exports "WATCHERS", we merge them
  if (module.WATCHERS && Array.isArray(module.WATCHERS)) {
    watchers.push(...module.WATCHERS);
  }
}

// Export the final watchers
export const ALL_WATCHERS = watchers;
