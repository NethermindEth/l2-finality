import { TransferService } from "./services/TransferService";
import { mergeValues, ValueMapping } from "./types";
import { UnixTime } from "@/core/types/UnixTime";
import { BlockRewardsHandler } from "@/core/controllers/appraiser/handlers/BlockRewardsHandler";
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

  public async value(block: Block): Promise<ValueMapping> {
    const timestamp: UnixTime = new UnixTime(block.timestamp);

    const blockTransactionReceipts =
      await this.provider.getBlockTransactionReceipts(block);

    const blockRewardSummary: ValueMapping =
      await this.blockRewardsHandler.handleBlockRewards(
        block,
        blockTransactionReceipts,
      );

    const transfers: ValueMapping = await this.transferService.handleTransfers(
      block.transactions,
      blockTransactionReceipts,
      timestamp,
    );

    return mergeValues([blockRewardSummary, transfers]);
  }
}
