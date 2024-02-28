import { ethers, Network } from "ethers";
import { Config } from "@/config";
import Logger from "@/tools/Logger";
import { PolygonZkEvmBatch } from "@/core/clients/polygonzk/types";

class PolygonZkEvmClient {
  private provider: ethers.JsonRpcProvider;
  private network: Network;
  private logger: Logger;

  constructor(config: Config, logger: Logger) {
    this.network = Network.from(
      ethers.Network.from(config.polygonZkEvmModule.chainId),
    );
    this.provider = new ethers.JsonRpcProvider(
      config.indexers.polygonZkEvmRpcEndpoint,
      this.network,
      { staticNetwork: this.network },
    );
    this.logger = logger;
  }

  public async getCurrentHeight(): Promise<number> {
    return await this.provider.getBlockNumber();
  }

  public async getBlock(
    blockHeight: number | string,
  ): Promise<[ethers.Block, ethers.TransactionResponse[]] | [null, null]> {
    const block = await this.provider.getBlock(blockHeight, true);
    if (!block) {
      return [null, null];
    }

    const txs = await Promise.all(
      block.transactions.map((hash: string) =>
        block.getPrefetchedTransaction(hash),
      ),
    );
    return [block, txs];
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
