import { TransferService } from "./services/TransferService";
import { TransferValueSummarizer } from "./aggregators/TransferValueSummarizer";
import { AggregatedTransferResults, BlockValue } from "./types";
import { UnixTime } from "@/core/types/UnixTime";
import { AppraisalSummary } from "@/core/controllers/appraiser/handlers/BaseHandler";
import {
  BlockRewardsHandler,
  BlockRewardSummary,
} from "@/core/controllers/appraiser/handlers/BlockRewardsHandler";
import { Block } from "@/core/clients/blockchain/IBlockchainClient";

export class BlockAppraiser {
  constructor(
    private transferService: TransferService,
    private blockRewardsHandler: BlockRewardsHandler,
  ) {}

  public async value(block: Block): Promise<BlockValue> {
    const timestamp: UnixTime = UnixTime.fromDate(
      new Date(block.timestamp * 1000),
    );

    const blockRewardSummary: BlockRewardSummary =
      await this.blockRewardsHandler.handleBlockRewards(block);

    const transfers: AppraisalSummary[] =
      await this.transferService.handleTransfers(block.transactions, timestamp);
    const aggregatedResults: AggregatedTransferResults =
      TransferValueSummarizer.aggregate(transfers);

    return {
      transferSummary: aggregatedResults,
      blockRewardSummary: blockRewardSummary,
    };
  }
}
