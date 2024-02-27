import BlockIndexerController, {
  BlockIndexerConfig,
} from "@/core/controllers/indexers/shared/BlockIndexerController";
import { Logger } from "@/tools/Logger";
import { Database } from "@/database/Database";
import { Config } from "@/config";
import { BlockValueRecord } from "@/database/repositories/BlockValueRepository";
import PolygonZkEvmClient from "@/core/clients/polygonzk/PolygonZkEvmClient";

class PolygonZkEvmBlockController extends BlockIndexerController {
  private polygonZkEvmClient: PolygonZkEvmClient;

  constructor(
    polygonZkEvmClient: PolygonZkEvmClient,
    config: Config,
    database: Database,
    logger: Logger,
  ) {
    const polygonZkEvmIndexerConfig: BlockIndexerConfig = {
      chainId: config.polygonZkEvmModule.chainId,
      maxBlockRange: config.polygonZkEvmModule.maxBlockRange,
      startBlockEnvVar: config.polygonZkEvmModule.startBlock,
    };

    super(
      polygonZkEvmClient,
      polygonZkEvmIndexerConfig,
      database,
      logger.for("PolygonZkEvm Block Controller"),
    );
    this.polygonZkEvmClient = polygonZkEvmClient;
  }

  protected async fetchBlocks(
    fromBlock: number,
    toBlock: number,
  ): Promise<void> {
    const recordsToAdd: BlockValueRecord[] = [];
    this.logger.debug(
      `Fetching PolygonZkEvm blocks for range: ${fromBlock} to block ${toBlock}`,
    );
    for (let startBlock = fromBlock; startBlock <= toBlock; startBlock++) {
      const [block, txs] = await this.polygonZkEvmClient.getBlock(startBlock);

      if (block && block.hash) {
        const record: BlockValueRecord = {
          l2_block_number: BigInt(startBlock),
          l2_block_hash: block.hash.toString(),
          l2_block_timestamp: new Date(block.timestamp * 1000),
          value: {}, // TODO: Add ERC-20 valuator
        };
        recordsToAdd.push(record);
      }
    }
    await this.blockValueRepository.upsertMany(this.chainId, recordsToAdd);
  }
}

export default PolygonZkEvmBlockController;
