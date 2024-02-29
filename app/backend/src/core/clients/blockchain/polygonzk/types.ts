export interface PolygonZkEvmBatch {
  number: string;
  coinbase: string;
  stateRoot: string;
  globalExitRoot: string;
  mainnetExitRoot: string;
  rollupExitRoot: string;
  localExitRoot: string;
  accInputHash: string;
  timestamp: string;
  sendSequencesTxHash: string;
  verifyBatchTxHash: string;
  closed: boolean;
  blocks: string[];
  transactions: string[];
  batchL2Data: string;
}
