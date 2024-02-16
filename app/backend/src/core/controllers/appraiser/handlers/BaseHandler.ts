// BaseHandler.ts
import { ethers } from "ethers";
import { UnixTime } from '../../../../core/types/UnixTime';
import Logger from '../../../../tools/Logger'

export interface TransferEvent {
  contractAddress: string;
  rawAmount: bigint;
  adjustedAmount?: number;
  usdValue?: number;
}

export abstract class BaseHandler {
  protected provider: ethers.Provider;
  protected logger: Logger;

  constructor(provider: ethers.Provider, logger: Logger) {
    this.provider = provider;
    this.logger = logger;
  }

  abstract handleTransferEvents(tx: ethers.TransactionResponse, timestamp: UnixTime): Promise<TransferEvent[]>;
}

