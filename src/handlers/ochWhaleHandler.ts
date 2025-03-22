// src/handlers/ochWhaleHandler.ts

/**
 * Another specialized handler that might handle both transactions and token transfers.
 */

import { IUniversalHandler } from "../types";
import { createPrefixedLogger } from "../logger/logger";
import { OptionalClientsManager } from "../clients/optionalClientsManager";
import { getTokenMetadataCached } from "../services/tokenMetadataCache";
import { TELEGRAM_DEFAULT_CHANNEL_ID } from "../config";
import { formatUnits } from "viem";

export class OchWhaleHandler implements IUniversalHandler {
  private log = createPrefixedLogger("OCHWhale");

  constructor(private clients: OptionalClientsManager) {}

  // Called by block watchers (AllWallets_Activity_Watcher)
  public async onTransactions(txs: any[]): Promise<void> {
    for (const tx of txs) {
      this.log.info(`Handling tx hash: ${tx.hash}`);

      const message = `0xe33 new transaction: https://abscan.org/tx/${tx.hash}`;

      if (this.clients.telegramClient) {
        try {
          await this.clients.telegramClient.sendMessage("-4702012128", message);
        } catch (err: any) {
          this.log.error(`Error sending telegram message: ${err.message}`);
        }
      }
    }
  }

  // Called by fallback watchers or specific watchers that see a "Transfer" event with no tokenId
  public async onERC20Transfer(logs: any[]): Promise<void> {
    for (const log of logs) {
      const from = log.args?.from;
      const to = log.args?.to;
      const value = log.args?.value?.toString() || "?";
      const contract = log.address as `0x${string}`;

      const metadata = await getTokenMetadataCached(contract);

      const receiver =
        from.toLowerCase() !==
        "0xe33a8c196ba14bc078dd21388e8c04650b81d1de".toLowerCase();
      const parsedValue = formatUnits(BigInt(value), metadata.decimals ?? 18);

      this.log.info(
        `ERC20 Transfer => ${metadata.symbol || "???"} from: ${from}, to: ${to}, value: ${value}`,
      );

      const message = `0xe33 wallet ${receiver ? "received" : "sent"} ${parsedValue} $${metadata.symbol} ${receiver ? `from ${from}` : `to ${to}`}`;

      if (this.clients.telegramClient) {
        try {
          await this.clients.telegramClient.sendMessage("-4702012128", message);
        } catch (err: any) {
          this.log.error(`Error sending telegram message: ${err.message}`);
        }
      }
    }
  }

  public async onERC721Transfer(logs: any[]): Promise<void> {
    // Called by watchers that detect Transfer(...) with value => typical ERC-20
    for (const log of logs) {
      const from = log.args?.from || "0x???";
      const to = log.args?.to || "0x???";
      const value = log.args?.tokenId?.toString() || "???";
      const contract = log.address as `0x${string}`;

      const metadata = await getTokenMetadataCached(contract);
      this.log.info(
        `ERC721 Transfer => from: ${from}, to: ${to}, tokenId: ${metadata.symbol} #${value}`,
      );

      const receiver =
        from.toLowerCase() !==
        "0xe33a8c196ba14bc078dd21388e8c04650b81d1de".toLowerCase();
      const message = `0xe33 wallet ${receiver ? "received" : "sent"} ${metadata.symbol} #${value} ${receiver ? `from ${from}` : `to ${to}`}`;

      if (this.clients.telegramClient) {
        try {
          await this.clients.telegramClient.sendMessage("-4702012128", message);
        } catch (err: any) {
          this.log.error(`Error sending telegram message: ${err.message}`);
        }
      }
    }
  }
}
