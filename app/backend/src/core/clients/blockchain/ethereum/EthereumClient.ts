import { ethers, Network } from "ethers";
import contracts from "./contracts/contracts.json";
import { Config } from "@/config";
import Logger from "@/tools/Logger";
import { ContractName } from "@/core/clients/blockchain/ethereum/contracts/types";
import {
  Block,
  ethersToBlock,
  ethersToTransactionReceipt,
  getEvmTransferEvent,
  IBlockchainClient,
  Log,
  TransactionReceipt,
} from "@/core/clients/blockchain/IBlockchainClient";
import { TransferLogEvent } from "@/core/controllers/appraiser/handlers/BaseHandler";

class EthereumClient implements IBlockchainClient {
  private readonly provider: ethers.JsonRpcProvider;
  private readonly network: Network;
  private readonly logger: Logger;

  public readonly chainId: number;

  constructor(config: Config, logger: Logger) {
    this.chainId = config.ethereumMonitorModule.chainId;
    this.network = Network.from(ethers.Network.from(this.chainId));
    this.provider = new ethers.JsonRpcProvider(
      config.indexers.ethereumRpcEndpoint,
      this.network,
      { staticNetwork: this.network },
    );
    this.logger = logger;
  }

  public getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }

  public async getCurrentHeight(): Promise<number> {
    const blockNumber = await this.provider.getBlock("finalized");
    if (blockNumber) {
      return blockNumber.number;
    } else {
      throw new Error("Failed to get current block number, null returned");
    }
  }

  public async getBlock(blockHeight: number): Promise<Block | undefined> {
    const block = await this.provider.getBlock(blockHeight, true);
    if (block) {
      return ethersToBlock(block);
    }
    this.logger.error(`Block not found: ${blockHeight}`);
  }

  public async getBlockTransactionReceipts(
    block: Block,
  ): Promise<TransactionReceipt[] | undefined> {
    const receipts: TransactionReceipt[] = [];

    for (const tx of block.transactions) {
      const receipt = await this.getTransactionReceipt(tx.hash);
      if (receipt) {
        receipts.push(receipt);
      }
    }
    return receipts;
  }

  public async getTransactionReceipt(
    txHash: string,
  ): Promise<TransactionReceipt | undefined> {
    const receipt = await this.provider.getTransactionReceipt(txHash);
    if (receipt) {
      return ethersToTransactionReceipt(receipt);
    }
    this.logger.error(`Transaction receipt not found: ${txHash}`);
  }

  public async getContractLogs(
    contractName: ContractName,
    fromBlock: number,
    toBlock: number,
  ): Promise<ethers.Log[]> {
    const contractInfo = contracts[contractName];
    if (!contractInfo) {
      this.logger.error(`Contract ${contractName} not found in contracts.json`);
      throw new Error(`Contract ${contractName} not found in contracts.json`);
    }

    const topics = Object.values(contractInfo.topics);
    return await this.provider.getLogs({
      fromBlock: ethers.toBeHex(fromBlock),
      toBlock: ethers.toBeHex(toBlock),
      address: contractInfo.address,
      topics: [topics],
    });
  }

  public getTransferEvent(log: Log): TransferLogEvent | undefined {
    return getEvmTransferEvent(log);
  }
}

export default EthereumClient;
