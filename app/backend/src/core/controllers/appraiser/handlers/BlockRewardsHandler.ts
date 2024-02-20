import { ethers } from "ethers";
import { UnixTime } from "@/core/types/UnixTime";
import { PriceService } from "../services/PriceService";
import Logger from "@/tools/Logger";

export interface BlockRewardSummary {
  gasFees: bigint;
  gasFeesUsd: number;
  blockReward: bigint;
  blockRewardUsd: number;
}

export class BlockRewardsHandler {
  private provider: ethers.Provider;
  private priceService: PriceService;
  private logger: Logger;

  constructor(
    provider: ethers.Provider,
    priceService: PriceService,
    logger: Logger,
  ) {
    this.provider = provider;
    this.priceService = priceService;
    this.logger = logger;
  }

  async handleBlockRewards(
    block: ethers.Block,
    txs: ethers.TransactionResponse[],
    timestamp: UnixTime,
  ): Promise<BlockRewardSummary> {
    let totalGasFees = BigInt(0);
    let totalTips = BigInt(0);

    for (const tx of txs) {
      const receipt = await this.provider.getTransactionReceipt(tx.hash);
      if (!receipt) continue;
      const gasUsed = receipt.gasUsed ? BigInt(receipt.gasUsed) : BigInt(0);

      const baseFeePerGas = block.baseFeePerGas
        ? BigInt(block.baseFeePerGas)
        : BigInt(0);
      const priorityFeePerGas = tx.maxPriorityFeePerGas
        ? BigInt(tx.maxPriorityFeePerGas)
        : BigInt(0);
      const maxFeePerGas = tx.maxFeePerGas
        ? BigInt(tx.maxFeePerGas)
        : BigInt(0);

      const effectiveGasPrice =
        baseFeePerGas + priorityFeePerGas < maxFeePerGas
          ? baseFeePerGas + priorityFeePerGas
          : maxFeePerGas;

      const gasFees = gasUsed * effectiveGasPrice;
      const tips = gasUsed * priorityFeePerGas;

      totalGasFees += gasFees;
      totalTips += tips;
    }

    const priceRecord = await this.priceService.getPriceWithRetry(
      ethers.ZeroAddress,
      timestamp,
    );
    const priceUsd = priceRecord ? priceRecord.priceUsd : 0;

    const gasFeesUsd =
      parseFloat(ethers.formatEther(totalGasFees.toString())) * priceUsd;
    const tipsUsd =
      parseFloat(ethers.formatEther(totalTips.toString())) * priceUsd;

    return {
      gasFees: totalGasFees,
      gasFeesUsd: gasFeesUsd,
      blockReward: totalTips,
      blockRewardUsd: tipsUsd,
    };
  }
}
