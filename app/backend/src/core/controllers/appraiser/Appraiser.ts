import { ethers } from "ethers";
import { Logger } from '../../../tools/Logger';
import { TransferService } from './services/TransferService';
import { TransferValueSummarizer } from './aggregators/TransferValueSummarizer';
import { AggregatedTransferResults } from './types';
import { UnixTime } from '../../../core/types/UnixTime'

export class BlockAppraiser {
  constructor(
    private transferService: TransferService,
    private transferAggregator: TransferValueSummarizer,
    private logger: Logger,
  ) {}

  public async value(txs: ethers.TransactionResponse[], timestamp: Date): Promise<AggregatedTransferResults> {
    const transfers = await this.transferService.handleTransfers(txs, UnixTime.fromDate(timestamp));
    const aggregatedResults = this.transferAggregator.aggregateTransfers(transfers);
    return aggregatedResults;
  }
}
