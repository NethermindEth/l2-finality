import { expect } from "earl";
import { TransferValueSummarizer } from "@/core/controllers/appraiser/aggregators/TransferValueSummarizer";
import { AppraisalSummary } from "@/core/controllers/appraiser/handlers/BaseHandler";
import { AggregatedTransferResults } from "@/core/controllers/appraiser/types";

describe(TransferValueSummarizer.name, () => {
  it("correctly aggregates transfer summaries", () => {
    const mockSummaries: AppraisalSummary[] = [
      { contractAddress: "0x1", rawAmount: BigInt(100), usdValue: 10 },
      { contractAddress: "0x1", rawAmount: BigInt(200), usdValue: 20 },
      { contractAddress: "0x2", rawAmount: BigInt(300) },
      { contractAddress: "0x2", rawAmount: BigInt(500) },
      { contractAddress: "0x3", rawAmount: BigInt(400), usdValue: 40 },
    ];

    const expectedResults: AggregatedTransferResults = {
      mapped: [
        { contractAddress: "0x1", usdTotalValue: 30 },
        { contractAddress: "0x3", usdTotalValue: 40 },
      ],
      unmapped: ["0x2"],
    };

    const results = TransferValueSummarizer.aggregate(mockSummaries);

    expect(results.mapped).toEqual(expectedResults.mapped);
    expect(results.unmapped).toEqual(expectedResults.unmapped);
  });
});
