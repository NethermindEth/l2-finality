import { TransferEvent } from '../handlers/BaseHandler';
import { AggregatedMappedTransfer, AggregatedUnmappedTransfer } from '../types';

export class TransferValueSummarizer {
  aggregateTransfers(transfers: TransferEvent[]): { mapped: AggregatedMappedTransfer[]; unmapped: AggregatedUnmappedTransfer[] } {
    const aggregatedMapped: { [key: string]: AggregatedMappedTransfer } = {};
    const aggregatedUnmapped: { [key: string]: AggregatedUnmappedTransfer } = {};

    transfers.forEach(transfer => {
      if ('usdValue' in transfer) {
        if (!aggregatedMapped[transfer.contractAddress]) {
          aggregatedMapped[transfer.contractAddress] = { contractAddress: transfer.contractAddress, usdTotalValue: 0 };
        }
        aggregatedMapped[transfer.contractAddress].usdTotalValue += transfer.usdValue ? transfer.usdValue : 0;
      } else {
        if (!aggregatedUnmapped[transfer.contractAddress]) {
          aggregatedUnmapped[transfer.contractAddress] = { contractAddress: transfer.contractAddress, rawTotalAmount: BigInt(0) };
        }
        aggregatedUnmapped[transfer.contractAddress].rawTotalAmount += transfer.rawAmount;
      }
    });

    return {
      mapped: Object.values(aggregatedMapped),
      unmapped: Object.values(aggregatedUnmapped),
    };
  }
}
