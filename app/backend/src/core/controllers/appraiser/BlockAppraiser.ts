import { ethers } from "ethers";
import { TransferService } from "./services/TransferService";
import { TransferValueSummarizer } from "./aggregators/TransferValueSummarizer";
import { AggregatedTransferResults, BlockValue } from "./types";
import { UnixTime } from "@/core/types/UnixTime";
import { AppraisalSummary } from "@/core/controllers/appraiser/handlers/BaseHandler";
import {
  BlockRewardsHandler,
  BlockRewardSummary,
} from "@/core/controllers/appraiser/handlers/BlockRewardsHandler";

export class BlockAppraiser {
  constructor(
    private transferService: TransferService,
    private blockRewardsHandler: BlockRewardsHandler,
  ) {}

  public async value(
    txs: ethers.TransactionResponse[],
    block: ethers.Block,
  ): Promise<BlockValue> {
    const timestamp: UnixTime = UnixTime.fromDate(
      new Date(block.timestamp * 1000),
    );

    const blockRewardSummary: BlockRewardSummary =
      await this.blockRewardsHandler.handleBlockRewards(block, txs);
    console.log(blockRewardSummary);

    const transfers: AppraisalSummary[] =
      await this.transferService.handleTransfers(txs, timestamp);
    console.log(transfers);
    const aggregatedResults: AggregatedTransferResults =
      TransferValueSummarizer.aggregate(transfers);
    console.log(aggregatedResults);

    return {
      transferSummary: aggregatedResults,
      blockRewardSummary: blockRewardSummary,
    };
  }
}
