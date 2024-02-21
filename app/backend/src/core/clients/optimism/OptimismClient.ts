import { ethers, Network } from "ethers";
import { Config } from "@/config";
import Logger from "@/tools/Logger";
import { OptimismSyncStatus } from "./types";

class OptimismClient {
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

  public async getBlock(
    blockHeight: number,
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

  public async getSyncStatus(): Promise<OptimismSyncStatus> {
    const result = (await this.provider.send(
      "optimism_syncStatus",
      [],
    )) as OptimismSyncStatus;
    return result;
  }
}

export default OptimismClient;
