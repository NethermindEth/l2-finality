import { BlockRewardSummary } from "@/core/controllers/appraiser/handlers/BlockRewardsHandler";

export type BlockValue = {
  transferSummary: AggregatedTransferResults;
  blockRewardSummary: BlockRewardSummary;
};

export type AggregatedTransferResults = {
  mapped: AggregatedMappedTransfer[];
  unmapped: AggregatedUnmappedTransfer[];
};

export type AggregatedMappedTransfer = {
  contractAddress: string;
  usdTotalValue: number;
};

export type AggregatedUnmappedTransfer = {
  contractAddress: string;
  rawTotalAmount: bigint;
};
