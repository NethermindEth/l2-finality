export interface OptimismOutputProposed {
  outputRoot: string;
  l2OutputIndex: bigint;
  l2BlockNumber: bigint;
  l1Timestamp: bigint;
}

export interface PolygonVerifyBatch {
  ethBlockNum: bigint;
  ethTxHash: string;
  numBatch: bigint;
  stateRoot: string;
  aggregator: string;
}

export interface PolygonSequenceBatch {
  ethBlockNum: bigint;
  ethTxHash: string;
  numBatch: bigint;
}
