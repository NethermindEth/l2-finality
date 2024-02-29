import { ethers } from "ethers";

export interface IBlockchainClient {
  getBlock(blockNumberOrHash: string | number): Promise<Block | undefined>;
  getTransaction?(txHash: string): Promise<Transaction | undefined>;
  getTransactionReceipt(
    txHash: string,
  ): Promise<TransactionReceipt | undefined>;
}

export interface Block {
  number: number;
  hash: string;
  timestamp: number;
  parentHash: string;
  nonce: string;
  difficulty: bigint;
  gasLimit: bigint;
  gasUsed: bigint;
  miner: string;
  extraData: string;
  baseFeePerGas: bigint;
  transactions: Transaction[];
}

export interface Transaction {
  blockNumber: number;
  blockHash: string;
  index: number;
  hash: string;
  type: number;
  from: string;
  to: string | null;
  nonce: number;
  gasLimit: bigint;
  gasPrice: bigint;
  maxPriorityFeePerGas: bigint;
  maxFeePerGas: bigint;
  data: string;
  value: bigint;
}

export interface Log {
  transactionIndex: number;
  address: string;
  data: string;
  topics: string[];
  blockNumber: number;
  blockHash: string;
  transactionHash: string;
  removed: boolean;
}

export interface TransactionReceipt {
  to: string | null;
  from: string;
  contractAddress: string | null;
  hash: string;
  index: number;
  blockHash: string;
  blockNumber: number;
  logsBloom: string;
  gasUsed: bigint;
  gasPrice: bigint;
  type: number;
  status: number | null;
  root: null | string;
  logs: Log[];
}

export function ethersToBlock(ethersBlock: ethers.Block): Block {
  const transactions = ethersBlock.transactions.map((txHash: string) => {
    const txResponse = ethersBlock.getPrefetchedTransaction(txHash);
    return ethersToTransaction(txResponse);
  });
  return {
    number: ethersBlock.number,
    hash: ethersBlock.hash ? ethersBlock.hash : "",
    timestamp: ethersBlock.timestamp,
    parentHash: ethersBlock.parentHash,
    nonce: ethersBlock.nonce,
    difficulty: ethersBlock.difficulty,
    gasLimit: ethersBlock.gasLimit,
    gasUsed: ethersBlock.gasUsed,
    miner: ethersBlock.miner,
    extraData: ethersBlock.extraData,
    baseFeePerGas: ethersBlock.baseFeePerGas
      ? BigInt(ethersBlock.baseFeePerGas)
      : BigInt(0),
    transactions: transactions,
  };
}

export function ethersToTransaction(
  ethersTransaction: ethers.TransactionResponse,
): Transaction {
  return {
    blockNumber: ethersTransaction.blockNumber!,
    blockHash: ethersTransaction.blockHash!,
    index: ethersTransaction.index!,
    hash: ethersTransaction.hash,
    type: ethersTransaction.type ?? 0,
    from: ethersTransaction.from,
    to: ethersTransaction.to || null,
    nonce: ethersTransaction.nonce,
    gasLimit: ethersTransaction.gasLimit,
    gasPrice: ethersTransaction.gasPrice,
    maxPriorityFeePerGas: ethersTransaction.maxPriorityFeePerGas
      ? BigInt(ethersTransaction.maxPriorityFeePerGas)
      : BigInt(0),
    maxFeePerGas: ethersTransaction.maxFeePerGas
      ? BigInt(ethersTransaction.maxFeePerGas)
      : BigInt(0),
    data: ethersTransaction.data,
    value: ethersTransaction.value,
  };
}

export function ethersToTransactionReceipt(
  ethersReceipt: ethers.TransactionReceipt,
): TransactionReceipt {
  return {
    to: ethersReceipt.to,
    from: ethersReceipt.from,
    contractAddress: ethersReceipt.contractAddress,
    hash: ethersReceipt.hash,
    index: ethersReceipt.index,
    blockHash: ethersReceipt.blockHash,
    blockNumber: ethersReceipt.blockNumber,
    logsBloom: ethersReceipt.logsBloom,
    gasUsed: ethersReceipt.gasUsed,
    gasPrice: ethersReceipt.gasPrice,
    type: ethersReceipt.type,
    status: ethersReceipt.status,
    root: ethersReceipt.root || null,
    logs: ethersReceipt.logs.map(
      (log: ethers.Log): Log =>
        <Log>{
          transactionIndex: log.transactionIndex ?? 0,
          address: log.address,
          data: log.data,
          topics: log.topics,
          blockNumber: log.blockNumber ?? 0,
          blockHash: log.blockHash ?? "",
          transactionHash: log.transactionHash ?? "",
          removed: log.removed ?? false,
        },
    ),
  };
}
