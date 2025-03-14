// src/handlers/transferHandler.ts

/**
 * Example event handler for Transfer events.
 */

import { IEventHandler } from "../types";
import { Logger } from "../logger";

export class TransferHandler implements IEventHandler {
  public async handleEvent(logs: any[]): Promise<void> {
    for (const log of logs) {
      // Each log typically has blockNumber, transactionHash, etc.
      // In viem, log.args may hold { from, to, value } if the ABI is known
      Logger.info(
        `Handling Transfer event - from: ${log.args?.from}, to: ${log.args?.to}, value: ${log.args?.value}`,
      );
      // Insert custom logic: store in DB, alert in Slack, etc.
    }
  }
}
