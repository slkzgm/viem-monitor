// src/handlers/erc20Handler.ts

/**
 * Example event handler for Transfer-like events.
 */

import { IEventHandler } from "../types";
import { Logger } from "../logger/logger";

export class Erc20Handler implements IEventHandler {
  public async handleEvent(logs: any[]): Promise<void> {
    for (const log of logs) {
      Logger.info(
        `Handling Transfer event - from: ${log.args?.from}, to: ${log.args?.to}, value: ${log.args?.value}`,
      );
      // Insert custom logic: DB insert, external API call, etc.
    }
  }
}
