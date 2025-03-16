// src/handlers/erc20Handler.ts

/**
 * Example event handler for Transfer-like events in ERC20.
 */

import { IEventHandler } from "../types";
import { createPrefixedLogger } from "../logger/logger";

export class Erc20Handler implements IEventHandler {
  private log = createPrefixedLogger("ERC20_Transfer_Handler");

  public async handleEvent(logs: any[]): Promise<void> {
    for (const log of logs) {
      this.log.info(
        `Handling ERC20 Transfer => from: ${log.args?.from}, to: ${log.args?.to}, value: ${log.args?.value}`,
      );
    }
  }
}
