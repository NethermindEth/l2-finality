export interface OptimismOutputProposed {
  outputRoot: string;
  l2OutputIndex: bigint;
  l2BlockNumber: bigint;
  l1Timestamp: bigint;
}

export interface PolygonVerifyBatch {
  numBatch: bigint;
  stateRoot: string;
  aggregator: string;
}

export interface PolygonSequenceBatch {
  numBatch: bigint;
}
