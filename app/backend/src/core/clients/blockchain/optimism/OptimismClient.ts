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

  public readonly chainId: number;

  constructor(config: Config, logger: Logger) {
    this.chainId = config.optimismModule.chainId;
    this.network = Network.from(ethers.Network.from(this.chainId));
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
      return ethersToBlock(block);
    }
    this.logger.error(`Block not found: ${blockHeight}`);
  }

  public async getBlockTransactionReceipts(
    block: Block,
  ): Promise<TransactionReceipt[] | undefined> {
    const receipts = await this.provider.send("eth_getBlockReceipts", [
      block.hash,
    ]);
    if (receipts) {
      return receipts.map((receipt: any) =>
        ethersToTransactionReceipt(
          receipt,
          receipt.transactionHash,
          receipt.l1GasPrice,
        ),
      );
    }
    this.logger.error(`Transaction receipts not found for block ${block.hash}`);
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
