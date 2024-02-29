import { UnixTime } from "@/core/types/UnixTime";
import Logger from "@/tools/Logger";
import {
  IBlockchainClient,
  Transaction,
} from "@/core/clients/blockchain/IBlockchainClient";

export interface AppraisalSummary {
  contractAddress: string;
  rawAmount: bigint;
  adjustedAmount?: number;
  usdValue?: number;
}

export interface TransferLogEvent {
  fromAddress: string;
  toAddress: string;
  contractAddress: string;
  rawAmount: bigint;
}

export interface PricedTransferLogEvent extends TransferLogEvent {
  adjustedAmount?: number;
  usdValue?: number;
}

export abstract class BaseHandler {
  protected provider: IBlockchainClient;
  protected logger: Logger;

  constructor(provider: IBlockchainClient, logger: Logger) {
    this.provider = provider;
    this.logger = logger;
  }

  abstract handleTransferEvents(
    tx: Transaction,
    timestamp: UnixTime,
  ): Promise<AppraisalSummary[]>;
}
