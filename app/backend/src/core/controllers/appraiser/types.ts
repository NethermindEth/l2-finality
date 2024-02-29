import { BlockRewardSummary } from "@/core/controllers/appraiser/handlers/BlockRewardsHandler";

export type BlockValue = {
  transferSummary: AggregatedTransferResults;
  blockRewardSummary: BlockRewardSummary;
};

export type AggregatedTransferResults = {
  mapped: AggregatedMappedTransfer[];
  unmapped: string[];
};

export type AggregatedMappedTransfer = {
  contractAddress: string;
  usdTotalValue: number;
};
