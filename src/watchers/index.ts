// src/watchers/index.ts

/**
 * Automatically collects all watchers from this directory,
 * merging them into a single array called ALL_WATCHERS.
 */

import fs from "fs";
import path from "path";
import { OptionalClientsManager } from "../clients/optionalClientsManager";
import { IWatcherConfig } from "../types";

interface IWatcherDefinition {
  config: IWatcherConfig;
  createHandler: (clients: OptionalClientsManager) => any;
}

const watchersDir = __dirname;
const watchers: IWatcherDefinition[] = [];

const files = fs.readdirSync(watchersDir);
for (const file of files) {
  // Skip these files (both .ts and .js variants)
  if (
    file.startsWith("index.") ||
    file.startsWith("client.") ||
    file.startsWith("watcherManager.")
  ) {
    continue;
  }
  // Accept files ending with .ts or .js
  if (!file.endsWith(".ts") && !file.endsWith(".js")) {
    continue;
  }

  const fullPath = path.join(watchersDir, file);
  const module = require(fullPath);
  if (module.WATCHERS && Array.isArray(module.WATCHERS)) {
    watchers.push(...module.WATCHERS);
  }
}

export const ALL_WATCHERS = watchers;
