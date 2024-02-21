import { AppraisalSummary } from "../handlers/BaseHandler";
import {
  AggregatedMappedTransfer,
  AggregatedTransferResults,
  AggregatedUnmappedTransfer,
} from "../types";

export class TransferValueSummarizer {
  static aggregate(summaries: AppraisalSummary[]): AggregatedTransferResults {
    const mapped: Record<string, AggregatedMappedTransfer> = {};
    const unmapped: Record<string, AggregatedUnmappedTransfer> = {};

    summaries.forEach((summary) => {
      const { contractAddress, rawAmount, usdValue } = summary;

      // Handle mapped transfers (with usdValue)
      if (usdValue !== undefined) {
        if (!mapped[contractAddress]) {
          mapped[contractAddress] = { contractAddress, usdTotalValue: 0 };
        }
        mapped[contractAddress].usdTotalValue += usdValue;
      } else {
        // Handle unmapped transfers (without usdValue)
        if (!unmapped[contractAddress]) {
          unmapped[contractAddress] = {
            contractAddress,
            rawTotalAmount: BigInt(0),
          };
        }
        unmapped[contractAddress].rawTotalAmount += rawAmount;
      }
    });

    const filteredUnmapped: AggregatedUnmappedTransfer[] = Object.values(
      unmapped,
    ).filter((transfer) => !mapped[transfer.contractAddress]);

    return {
      mapped: Object.values(mapped),
      unmapped: filteredUnmapped,
    };
  }
}
