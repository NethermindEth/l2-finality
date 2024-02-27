import { ethers, Network } from "ethers";
import { Config } from "@/config";
import Logger from "@/tools/Logger";

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
}

export default PolygonZkEvmClient;
