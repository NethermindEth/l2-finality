import { ethers, Network } from 'ethers'
import contracts from "./contracts/contracts.json";
import { Config } from "@/config";
import Logger from "@/tools/Logger";
import { ContractName } from "@/core/clients/blockchain/ethereum/contracts/types";
import {
  Block,
  ethersToBlock,
  ethersToTransactionReceipt,
  IBlockchainClient,
  TransactionReceipt,
} from "@/core/clients/blockchain/IBlockchainClient";

class EthereumClient implements IBlockchainClient {
  private provider: ethers.JsonRpcProvider;
  private network: Network;
  private logger: Logger;

  constructor(config: Config, logger: Logger) {
    this.network = Network.from(
      ethers.Network.from(config.ethereumMonitorModule.chainId),
    );
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
}

export default EthereumClient;
