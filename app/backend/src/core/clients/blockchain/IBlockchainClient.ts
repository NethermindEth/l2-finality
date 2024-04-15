import { ethers } from "ethers";
import { TransferLogEvent } from "@/core/controllers/appraiser/handlers/BaseHandler";
import { getChecksumAddress } from "starknet";

export interface IBlockchainClient {
  chainId: number;
  getCurrentHeight(): Promise<number>;
  getBlock(blockNumberOrHash: string | number): Promise<Block | undefined>;
  getTransaction?(txHash: string): Promise<Transaction | undefined>;
  getBlockTransactionReceipts(
    block: Block,
  ): Promise<TransactionReceipt[] | undefined>;
  getTransferEvent(log: Log): TransferLogEvent | undefined;
}

export interface Block {
  number: number;
  hash: string;
  timestamp: number;
  parentHash?: string;
  nonce?: string;
  difficulty?: bigint;
  gasLimit?: bigint;
  gasUsed?: bigint;
  miner?: string;
  extraData?: string;
  baseFeePerGas: bigint;
  sequencerAddress?: string;
  transactions: Transaction[];
}

export interface Transaction {
  blockNumber: number;
  blockHash?: string;
  index?: number;
  hash: string;
  type?: number;
  from?: string;
  to?: string | null;
  nonce?: number;
  gasLimit?: bigint;
  gasPrice: bigint;
  maxPriorityFeePerGas: bigint;
  maxFeePerGas: bigint;
  data?: string;
  value: bigint;
}

export interface Log {
  transactionIndex?: number;
  address: string;
  data: string;
  topics: string[];
  blockNumber?: number;
  blockHash?: string;
  transactionHash: string;
  removed?: boolean;
}

export interface TransactionReceipt {
  to?: string | null;
  from?: string;
  contractAddress?: string | null;
  hash: string;
  index?: number;
  blockHash?: string;
  blockNumber?: number;
  logsBloom?: string;
  gasUsed: bigint;
  gasPrice?: bigint;
  gasAsset?: string;
  type?: number;
  status?: number | null;
  root?: null | string;
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
  hash?: string,
  gasPrice?: bigint,
  gasAsset?: string,
): TransactionReceipt {
  return {
    to: ethersReceipt.to,
    from: ethersReceipt.from,
    contractAddress: ethersReceipt.contractAddress,
    hash: hash ? hash : ethersReceipt.hash,
    index: ethersReceipt.index,
    blockHash: ethersReceipt.blockHash,
    blockNumber: ethersReceipt.blockNumber,
    logsBloom: ethersReceipt.logsBloom,
    gasUsed: ethersReceipt.gasUsed,
    gasPrice: gasPrice ? gasPrice : ethersReceipt.gasPrice,
    gasAsset: gasAsset ?? ethers.ZeroAddress,
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

const EvmTransferEventHash = ethers.id("Transfer(address,address,uint256)");

export function getEvmTransferEvent(log: Log): TransferLogEvent | undefined {
  if (log.topics[0] === EvmTransferEventHash && log.topics.length == 3) {
    const contractAddress = ethers.getAddress(log.address);
    const fromAddress = ethers.getAddress(`0x${log.topics[1].slice(26)}`);
    const toAddress = ethers.getAddress(`0x${log.topics[2].slice(26)}`);
    const rawAmount = log.data === "0x" ? BigInt(0) : BigInt(log.data);
    return {
      fromAddress,
      toAddress,
      contractAddress,
      rawAmount,
    };
  }
}

// Converts Starknet address to checksummed format
export function getStarknetAddress(address: string): string {
  if (address == "0x0" || address == "0x1")
    // Starknet special addresses
    return address;
  else return getChecksumAddress(address);
}

// Converts Starknet or EVM address to checksummed format
export function getAnyAddress(address: string): string {
  if (address.length > 42) return getStarknetAddress(address);
  else return ethers.getAddress(address);
}
