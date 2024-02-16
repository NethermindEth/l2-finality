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