import { ethers } from "ethers";
import { UnixTime } from "@/core/types/UnixTime";
import { PriceService } from "../services/PriceService";
import {
  Block,
  TransactionReceipt,
} from "@/core/clients/blockchain/IBlockchainClient";
import chains from "@/shared/chains.json";
import { ValueMapping } from "@/core/controllers/appraiser/types";
import { ValueType } from "@/database/repositories/BlockValueRepository";

export class BlockRewardsHandler {
  private readonly chainId: number;
  private readonly priceService: PriceService;

  constructor(chainId: number, priceService: PriceService) {
    this.chainId = chainId;
    this.priceService = priceService;
  }

  async handleBlockRewards(
    block: Block,
    blockTransactionReceipts: TransactionReceipt[] | undefined,
  ): Promise<ValueMapping> {
    let totalGasFees = BigInt(0);
    let totalTips = BigInt(0);

    if (!blockTransactionReceipts) {
      return {};
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

      const { gasFees, tips } = this.calculateBlockRewardByChainId(
        gasUsed,
        transaction.gasPrice,
        baseFeePerGas,
        priorityFeePerGas,
        maxFeePerGas,
      );

      totalGasFees += gasFees;
      totalTips += tips;
    }

    const priceRecord = await this.priceService.getPriceForContract(
      ethers.ZeroAddress,
      UnixTime.fromDate(new Date(block.timestamp * 1000)),
    );
    const priceUsd = priceRecord ? priceRecord.priceUsd : 0;

    const gasFeesAdjusted = parseFloat(
      ethers.formatEther(totalGasFees.toString()),
    );
    const gasFeesUsd = gasFeesAdjusted * priceUsd;
    const tipsAdjusted = parseFloat(ethers.formatEther(totalTips.toString()));
    const tipsUsd = tipsAdjusted * priceUsd;

    return {
      byType: {
        [ValueType.gas_fees]: {
          value_asset: gasFeesAdjusted,
          value_usd: gasFeesUsd,
        },
        [ValueType.block_reward]: {
          value_asset: tipsAdjusted,
          value_usd: tipsUsd,
        },
      },
    };
  }

  calculateBlockRewardByChainId(
    gasUsed: bigint,
    gasPrice: bigint,
    baseFeePerGas: bigint,
    priorityFeePerGas: bigint,
    maxFeePerGas: bigint,
  ): { gasFees: bigint; tips: bigint } {
    const effectiveGasPrice =
      baseFeePerGas + priorityFeePerGas != BigInt(0)
        ? baseFeePerGas + priorityFeePerGas
        : gasPrice;

    let gasFees: bigint;
    let tips: bigint;

    switch (this.chainId) {
      case chains.Optimism.chainId:
        // Base fee isn't burned in OP
        gasFees = gasUsed * effectiveGasPrice;
        tips = gasUsed * effectiveGasPrice;
        break;

      case chains.zkEVM.chainId:
        // maxFeePerGas, priorityFeePerGas and baseFeePerGas are null in zkEVM
        gasFees = gasUsed * gasPrice;
        tips = gasUsed * gasPrice;
        break;

      case chains.Starknet.chainId:
        // All fees are included as part of the Transfer events in Starknet
        gasFees = BigInt(0);
        tips = BigInt(0);
        break;

      default:
        throw Error(
          `Chain ID ${this.chainId} not supported in calculateBlockRewardByChainId`,
        );
    }

    return {
      gasFees,
      tips,
    };
  }
}
