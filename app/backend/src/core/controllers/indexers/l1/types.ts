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
