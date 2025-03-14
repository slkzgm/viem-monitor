// src/types.ts

/**
 * Types and interfaces for watchers and handlers.
 */

export interface IEventHandler {
  handleEvent(logs: any[]): Promise<void>;
}

export interface IWatcherConfig {
  name: string;
  address?: `0x${string}`;
  abi?: any;
  eventName?: string;
  args?: Record<string, unknown>;
  fromBlock?: bigint;
}
