import { ethers, Network } from "ethers";
import { Config } from "@/config";
import Logger from "@/tools/Logger";
import { PolygonZkEvmBatch } from "@/core/clients/blockchain/polygonzk/types";
import {
  Block,
  ethersToBlock,
  ethersToTransactionReceipt,
  getEvmAddress,
  getEvmEventHash,
  IBlockchainClient,
  TransactionReceipt,
} from "@/core/clients/blockchain/IBlockchainClient";

class PolygonZkEvmClient implements IBlockchainClient {
  private readonly provider: ethers.JsonRpcProvider;
  private readonly network: Network;
  private readonly logger: Logger;

  public readonly chainId: number;

  constructor(config: Config, logger: Logger) {
    this.chainId = config.polygonZkEvmModule.chainId;
    this.network = Network.from(ethers.Network.from(this.chainId));
    this.provider = new ethers.JsonRpcProvider(
      config.indexers.polygonZkEvmRpcEndpoint,
      this.network,
      { staticNetwork: this.network },
    );
    this.logger = logger;
  }

  public getAddress(data: string): string {
    return getEvmAddress(data);
  }

  public getEventHash(name: string, params: string[]): string {
    return getEvmEventHash(name, params);
  }

  public async getCurrentHeight(): Promise<number> {
    return await this.provider.getBlockNumber();
  }

  public async getBlock(
    blockHeight: number | string,
  ): Promise<Block | undefined> {
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

  public async getBatchByNumber(
    batchNumber: number,
  ): Promise<PolygonZkEvmBatch> {
    const result = (await this.provider.send("zkevm_getBatchByNumber", [
      batchNumber,
    ])) as PolygonZkEvmBatch;
    return result;
  }
}

export default PolygonZkEvmClient;
