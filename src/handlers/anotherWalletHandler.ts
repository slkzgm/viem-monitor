// src/handlers/anotherWalletHandler.ts

/**
 * Another specialized handler that might handle both transactions and token transfers.
 */

import { IUniversalHandler } from "../types";
import { createPrefixedLogger } from "../logger/logger";
import { OptionalClientsManager } from "../clients/optionalClientsManager";
import { getTokenMetadataCached } from "../services/tokenMetadataCache";

export class AnotherWalletHandler implements IUniversalHandler {
  private log = createPrefixedLogger("AnotherWalletHandler");

  constructor(private clients: OptionalClientsManager) {}

  // Called by block watchers (AllWallets_Activity_Watcher)
  public async onTransactions(txs: any[]): Promise<void> {
    for (const tx of txs) {
      this.log.info(
        `AnotherWalletHandler => TX from: ${tx.from}, to: ${tx.to}, hash: ${tx.hash}`,
      );
      // Possibly do more logic, e.g. tweet or store in DB
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
      this.log.info(
        `AnotherWalletHandler => ERC20 Transfer from: ${from}, to: ${to}, value: ${value}`,
      );
      this.log.info(
        `ERC20 Transfer => ${metadata.symbol || "???"} from: ${from}, to: ${to}, value: ${value}`,
      );
      // Possibly broadcast, tweet, etc.
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

      // Maybe tweet about it:
      if (this.clients.twitterClient) {
        try {
          await this.clients.twitterClient.sendTweet(
            `ERC721 transfer: from ${from.slice(0, 6)}... to ${to.slice(0, 6)}... tokenId ${value}`,
          );
        } catch (err: any) {
          this.log.error(`Error sending tweet: ${err.message}`);
        }
      }
    }
  }
}
