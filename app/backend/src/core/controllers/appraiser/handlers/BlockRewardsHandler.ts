import { UnixTime } from "@/core/types/UnixTime";
import { PriceService } from "../services/PriceService";
import {
  Block,
  TransactionReceipt,
} from "@/core/clients/blockchain/IBlockchainClient";
import chains from "@/shared/chains.json";
import { mergeValues } from "@/core/controllers/appraiser/types";
import { ValueType } from "@/shared/api/viewModels/SyncStatusEndpoint";
import { whitelistedMap } from "@/core/clients/coingecko/assets/types";
import { ValueMapping } from "@/core/controllers/appraiser/types";

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
    if (!blockTransactionReceipts) {
      return {};
    }

    const totalByAsset: { [asset: string]: { fees: 0n; tips: 0n } } = {};
    for (const receipt of blockTransactionReceipts) {
      if (!receipt || !receipt.gasAsset) continue;

      const transaction = block.transactions.find(
        (tx) => tx.hash === receipt.hash,
      );
      if (!transaction) continue;

      const gasUsed = receipt.gasUsed ? BigInt(receipt.gasUsed) : 0n;
      const gasPrice = receipt.gasPrice
        ? receipt.gasPrice
        : transaction.gasPrice;

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
        gasPrice,
        baseFeePerGas,
        priorityFeePerGas,
        maxFeePerGas,
      );

      totalByAsset[receipt.gasAsset] ??= { fees: 0n, tips: 0n };
      totalByAsset[receipt.gasAsset].fees += gasFees;
      totalByAsset[receipt.gasAsset].tips += tips;
    }

    const values: ValueMapping[] = await Promise.all(
      Object.keys(totalByAsset).map(async (asset) => {
        const priceRecord = await this.priceService.getPriceForContract(
          asset,
          new UnixTime(block.timestamp),
        );
        const priceUsd = priceRecord ? priceRecord.priceUsd : 0;

        const total = totalByAsset[asset];
        const gasFeesAdjusted =
          whitelistedMap.adjustValue(this.chainId, asset, total.fees) ?? 0;
        const gasFeesUsd = gasFeesAdjusted * priceUsd;
        const tipsAdjusted =
          whitelistedMap.adjustValue(this.chainId, asset, total.tips) ?? 0;
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
      }),
    );

    return mergeValues(values);
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
        // All fees are paid directly to the Sequencer in Starknet
        gasFees = gasUsed * gasPrice;
        tips = gasUsed * gasPrice;
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
