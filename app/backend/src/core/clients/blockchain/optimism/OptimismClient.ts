import { ethers, Network } from "ethers";
import { Config } from "@/config";
import Logger from "@/tools/Logger";
import { OptimismSyncStatus } from "./types";
import {
  Block,
  ethersToBlock,
  ethersToTransactionReceipt,
  IBlockchainClient,
  TransactionReceipt,
} from "@/core/clients/blockchain/IBlockchainClient";

class OptimismClient implements IBlockchainClient {
  private provider: ethers.JsonRpcProvider;
  private network: Network;
  private logger: Logger;

  constructor(config: Config, logger: Logger) {
    this.network = Network.from(
      ethers.Network.from(config.optimismModule.chainId),
    );
    this.provider = new ethers.JsonRpcProvider(
      config.indexers.optimismRpcEndpoint,
      this.network,
      { staticNetwork: this.network },
    );
    this.logger = logger;
  }

  public async getCurrentHeight(): Promise<number> {
    return await this.provider.getBlockNumber();
  }

  public async getBlock(blockHeight: number): Promise<Block | undefined> {
    const block = await this.provider.getBlock(blockHeight, true);
    if (block) {
      try {
        return ethersToBlock(block);
      } catch (e) {
        this.logger.error(`Error getting block: ${e}`);
      }
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

  public async getSyncStatus(): Promise<OptimismSyncStatus> {
    const result = (await this.provider.send(
      "optimism_syncStatus",
      [],
    )) as OptimismSyncStatus;
    return result;
  }
}

export default OptimismClient;
