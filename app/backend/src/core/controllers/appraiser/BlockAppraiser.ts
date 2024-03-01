import { TransferService } from "./services/TransferService";
import { TransferValueSummarizer } from "./aggregators/TransferValueSummarizer";
import { AggregatedTransferResults, BlockValue } from "./types";
import { UnixTime } from "@/core/types/UnixTime";
import { AppraisalSummary } from "@/core/controllers/appraiser/handlers/BaseHandler";
import {
  BlockRewardsHandler,
  BlockRewardSummary,
} from "@/core/controllers/appraiser/handlers/BlockRewardsHandler";
import {
  Block,
  IBlockchainClient,
} from "@/core/clients/blockchain/IBlockchainClient";

export class BlockAppraiser {
  constructor(
    private provider: IBlockchainClient,
    private transferService: TransferService,
    private blockRewardsHandler: BlockRewardsHandler,
  ) {}

  public async value(block: Block): Promise<BlockValue> {
    const timestamp: UnixTime = new UnixTime(block.timestamp);

    const blockTransactionReceipts =
      await this.provider.getBlockTransactionReceipts(block);

    const blockRewardSummary: BlockRewardSummary =
      await this.blockRewardsHandler.handleBlockRewards(
        block,
        blockTransactionReceipts,
      );

    const transfers: AppraisalSummary[] =
      await this.transferService.handleTransfers(
        block.transactions,
        blockTransactionReceipts,
        timestamp,
      );
    const aggregatedResults: AggregatedTransferResults =
      TransferValueSummarizer.aggregate(transfers);

    return {
      transferSummary: aggregatedResults,
      blockRewardSummary: blockRewardSummary,
    };
  }
}
