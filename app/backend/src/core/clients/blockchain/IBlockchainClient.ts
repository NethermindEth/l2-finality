import { ethers } from "ethers";

export interface IBlockchainClient {
  chainId: number;
  getEventHash(name: string, params: string[]): string;
  getBlock(blockNumberOrHash: string | number): Promise<Block | undefined>;
  getTransaction?(txHash: string): Promise<Transaction | undefined>;
  getBlockTransactionReceipts(
    block: Block,
  ): Promise<TransactionReceipt[] | undefined>;
}

export interface Block {
  number: number;
  hash: string;
  timestamp: number;
  gasUsed: bigint;
  baseFeePerGas: bigint;
  transactions: Transaction[];
}

export interface Transaction {
  blockNumber: number;
  hash: string;
  gasPrice: bigint;
  maxPriorityFeePerGas: bigint;
  maxFeePerGas: bigint;
  value: bigint;
}

export interface Log {
  address: string;
  data: string;
  topics: string[];
  transactionHash: string;
}

export interface TransactionReceipt {
  hash: string;
  gasUsed: bigint;
  gasPrice: bigint;
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
    gasUsed: ethersBlock.gasUsed,
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
    hash: ethersTransaction.hash,
    gasPrice: ethersTransaction.gasPrice,
    maxPriorityFeePerGas: ethersTransaction.maxPriorityFeePerGas
      ? BigInt(ethersTransaction.maxPriorityFeePerGas)
      : BigInt(0),
    maxFeePerGas: ethersTransaction.maxFeePerGas
      ? BigInt(ethersTransaction.maxFeePerGas)
      : BigInt(0),
    value: ethersTransaction.value,
  };
}

export function ethersToTransactionReceipt(
  ethersReceipt: ethers.TransactionReceipt,
  hash?: string,
  gasPrice?: bigint,
): TransactionReceipt {
  return {
    hash: hash ? hash : ethersReceipt.hash,
    gasUsed: ethersReceipt.gasUsed,
    gasPrice: gasPrice ? gasPrice : ethersReceipt.gasPrice,
    logs: ethersReceipt.logs.map(
      (log: ethers.Log): Log =>
        <Log>{
          address: log.address,
          data: log.data,
          topics: log.topics,
          transactionHash: log.transactionHash ?? "",
        },
    ),
  };
}

export function getEvmEventHash(name: string, params: string[]): string {
  return ethers.id(`${name}(${params.join(",")})`);
}
