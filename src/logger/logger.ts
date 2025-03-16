// src/logger/logger.ts

/**
 * This file initializes a Pino logger for the entire application.
 * The exported "logger" is a root logger.
 * The "createPrefixedLogger" function returns a child logger with a prefix property.
 */

import pino from "pino";

/**
 * Basic Pino instance.
 * You can configure `pino-pretty` in dev, or adjust levels, etc.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport:
    process.env.NODE_ENV !== "production"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
          },
        }
      : undefined,
});

/**
 * Creates a child logger that automatically includes a "prefix"
 * in each log line. Example usage:
 *
 *   const prefixed = createPrefixedLogger("ERC20_Transfer_Watcher")
 *   prefixed.info("Hello World")
 *
 * Output:
 *   {"level":30,"time":...,"prefix":"ERC20_Transfer_Watcher","msg":"Hello World"}
 */
export function createPrefixedLogger(prefix: string) {
  return logger.child({ prefix });
}
