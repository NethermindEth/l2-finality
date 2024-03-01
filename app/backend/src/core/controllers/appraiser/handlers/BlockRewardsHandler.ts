import { ethers } from "ethers";
import { UnixTime } from "@/core/types/UnixTime";
import { PriceService } from "../services/PriceService";
import {
  Block,
  TransactionReceipt,
} from "@/core/clients/blockchain/IBlockchainClient";

export interface BlockRewardSummary {
  gasFees: bigint;
  gasFeesUsd: number;
  blockReward: bigint;
  blockRewardUsd: number;
}

export class BlockRewardsHandler {
  private priceService: PriceService;

  constructor(priceService: PriceService) {
    this.priceService = priceService;
  }

  async handleBlockRewards(
    block: Block,
    blockTransactionReceipts: TransactionReceipt[] | undefined,
  ): Promise<BlockRewardSummary> {
    let totalGasFees = BigInt(0);
    let totalTips = BigInt(0);

    if (!blockTransactionReceipts) {
      return {
        gasFees: totalGasFees,
        gasFeesUsd: 0,
        blockReward: totalTips,
        blockRewardUsd: 0,
      };
    }

    for (const receipt of blockTransactionReceipts) {
      if (!receipt) continue;
      const gasUsed = receipt.gasUsed ? BigInt(receipt.gasUsed) : BigInt(0);

      const transaction = block.transactions.find(
        (tx) => tx.hash === receipt.hash,
      );
      if (!transaction) continue;

      const baseFeePerGas = block.baseFeePerGas
        ? BigInt(block.baseFeePerGas)
        : BigInt(0);
      const priorityFeePerGas = transaction.maxPriorityFeePerGas
        ? BigInt(transaction.maxPriorityFeePerGas)
        : BigInt(0);
      const maxFeePerGas = transaction.maxFeePerGas
        ? BigInt(transaction.maxFeePerGas)
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

    const priceRecord = await this.priceService.getPriceForContract(
      ethers.ZeroAddress,
      UnixTime.fromDate(new Date(block.timestamp * 1000)),
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
