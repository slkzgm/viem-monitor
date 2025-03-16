// src/watchers/index.ts

/**
 * Automatically collects all watchers from this directory,
 * merging them into a single array called ALL_WATCHERS.
 *
 * We rely on __dirname and require(...) in a CommonJS environment.
 */

import fs from "fs";
import path from "path";
import { IWatcherConfig } from "../types";
import { OptionalClientsManager } from "../clients/optionalClientsManager";

interface IWatcherDefinition {
  config: IWatcherConfig;
  createHandler: (clients: OptionalClientsManager) => any;
}

const watchersDir = __dirname;
const watchers: IWatcherDefinition[] = [];

const files = fs.readdirSync(watchersDir);
for (const file of files) {
  if (
    file === "index.ts" ||
    file === "client.ts" ||
    file === "watcherManager.ts" ||
    !file.endsWith(".ts")
  ) {
    continue;
  }

  const fullPath = path.join(watchersDir, file);
  const module = require(fullPath);

  if (module.WATCHERS && Array.isArray(module.WATCHERS)) {
    watchers.push(...module.WATCHERS);
  }
}

export const ALL_WATCHERS = watchers;
