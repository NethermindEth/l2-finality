import { AppraisalSummary } from "../handlers/BaseHandler";
import { AggregatedMappedTransfer, AggregatedTransferResults } from "../types";

export class TransferValueSummarizer {
  static aggregate(summaries: AppraisalSummary[]): AggregatedTransferResults {
    const mapped: Record<string, AggregatedMappedTransfer> = {};
    const unmapped: Set<string> = new Set(); // Use a Set to avoid duplicates easily

    summaries.forEach((summary) => {
      const { contractAddress, usdValue } = summary;

      // Handle mapped transfers (with usdValue)
      if (usdValue !== undefined) {
        if (!mapped[contractAddress]) {
          mapped[contractAddress] = { contractAddress, usdTotalValue: 0 };
        }
        mapped[contractAddress].usdTotalValue += usdValue;
      } else {
        // Handle unmapped transfers (without usdValue)
        unmapped.add(contractAddress);
      }
    });

    const filteredUnmapped = Array.from(unmapped).filter(
      (address) => !mapped[address],
    );

    return {
      mapped: Object.values(mapped),
      unmapped: filteredUnmapped,
    };
  }
}
