import Logger from "@/tools/Logger";
import { BlockRewardsHandler } from "@/core/controllers/appraiser/handlers/BlockRewardsHandler";
import { PriceService } from "@/core/controllers/appraiser/services/PriceService";
import { getConfig } from "@/config";
import { expect, mockFn } from "earl";
import {
  Block,
  IBlockchainClient,
} from "@/core/clients/blockchain/IBlockchainClient";
import { BlockAppraiser } from "@/core/controllers/appraiser/BlockAppraiser";
import {
  WhitelistedAsset,
  whitelistedMap,
} from "@/core/clients/coingecko/assets/types";
import StarknetClient from "@/core/clients/blockchain/starknet/StarknetClient";
import { TransferService } from "@/core/controllers/appraiser/services/TransferService";
import { TokenTransferHandler } from "@/core/controllers/appraiser/handlers/TokenTransfers";
import { NativeTransferHandler } from "@/core/controllers/appraiser/handlers/NativeTransfers";

describe(`${BlockAppraiser.name} on Starknet`, () => {
  let chainId: number;
  let assets: { [chainId: string]: WhitelistedAsset };
  let fakePrice = { priceUsd: 10 };
  let noBlockRewards = {
    gasFees: BigInt(0),
    gasFeesUsd: 0,
    blockReward: BigInt(0),
    blockRewardUsd: 0,
  };

  let priceServiceMock: PriceService;

  let client: IBlockchainClient;
  let blockAppraiser: BlockAppraiser;

  beforeEach(async () => {
    const logger = new Logger();
    const config = getConfig();

    chainId = config.starknetModule.chainId;
    assets = whitelistedMap[chainId];

    priceServiceMock = {
      getPriceForContract: mockFn().returns(fakePrice),
    } as any as PriceService;

    client = new StarknetClient(config, logger);

    const tokenTransferHandler = new TokenTransferHandler(
      client,
      logger,
      priceServiceMock,
    );
    const transferService = new TransferService(
      tokenTransferHandler,
      {} as NativeTransferHandler,
    );
    const blockRewardsHandler = new BlockRewardsHandler(
      chainId,
      priceServiceMock,
    );
    blockAppraiser = new BlockAppraiser(
      client,
      transferService,
      blockRewardsHandler,
    );
  });

  // https://voyager.online/tx/0x6f69459c4196222a227d4e4c79787f4ffcb51b47f7f545fbc01a0753175aa7b
  it("handles transaction without transfers", async () => {
    const block = await getBlockWithTx(
      595593,
      "0x6f69459c4196222a227d4e4c79787f4ffcb51b47f7f545fbc01a0753175aa7b",
    );

    const value = await blockAppraiser.value(block!);

    expect(value).toEqual({
      // Fees
      byType: {
        block_reward: {
          value_asset: 0.3597364094176778,
          value_usd: 3.597364094176778,
        },
        gas_fees: {
          value_asset: 0.3597364094176778,
          value_usd: 3.597364094176778,
        },
      },
    });
  });

  // https://voyager.online/tx/0x10eebefaef1771ceac9a7ace258e5efeeb5ef27bfa12559c3884173ac0b28ac
  it("handles simple transfer", async () => {
    const block = await getBlockWithTx(
      595564,
      "0x10eebefaef1771ceac9a7ace258e5efeeb5ef27bfa12559c3884173ac0b28ac",
    );

    const value = await blockAppraiser.value(block!);

    expect(value).toEqual({
      // Transfer
      byContract: {
        [assets["STRK"].address!]: {
          value_usd: 470.72 * fakePrice.priceUsd,
          value_asset: 470.72,
        },
      },
      byType: {
        token_transfer: {
          value_asset: 470.72,
          value_usd: 4707.200000000001,
        },
        // Fees
        block_reward: {
          value_asset: 0.00025715858141008,
          value_usd: 0.0025715858141008,
        },
        gas_fees: {
          value_asset: 0.00025715858141008,
          value_usd: 0.0025715858141008,
        },
      },
    });
  });

  // https://voyager.online/tx/0x79c06c1550f98797c0ea76228f2e54d4b5b495f85ac85e555e4a1b111453e04
  it("handles swap", async () => {
    const block = await getBlockWithTx(
      595593,
      "0x79c06c1550f98797c0ea76228f2e54d4b5b495f85ac85e555e4a1b111453e04",
    );

    const value = await blockAppraiser.value(block!);

    expect(value).toEqual({
      // Swap
      byContract: {
        [assets["STRK"].address!]: {
          value_asset: 20.0,
          value_usd: 20.0 * fakePrice.priceUsd,
        },
      },
      byType: {
        token_swap: {
          value_asset: 20,
          value_usd: 20.0 * fakePrice.priceUsd,
        },
        // Fees
        block_reward: {
          value_asset: 0.978754939960334552,
          value_usd: 0.978754939960334552 * fakePrice.priceUsd,
        },
        gas_fees: {
          value_asset: 0.978754939960334552,
          value_usd: 0.978754939960334552 * fakePrice.priceUsd,
        },
      },
    });
  });

  // https://voyager.online/tx/0x4c213caef8e503a7b3c54edf18ebca1d6117e1821d68ea5e6db1ef63aee6f04
  it("handles swap with unmapped asset", async () => {
    const block = await getBlockWithTx(
      613171,
      "0x4c213caef8e503a7b3c54edf18ebca1d6117e1821d68ea5e6db1ef63aee6f04",
    );

    const value = await blockAppraiser.value(block!);

    expect(value).toEqual({
      byContract: {
        [assets["DAI"].address!]: {
          value_asset: 68.1564002479382,
          value_usd: 68.1564002479382 * fakePrice.priceUsd,
        },
      },
      byType: {
        block_reward: {
          value_asset: 0.00000353393256644,
          value_usd: 0.00000353393256644 * fakePrice.priceUsd,
        },
        gas_fees: {
          value_asset: 0.00000353393256644,
          value_usd: 0.00000353393256644 * fakePrice.priceUsd,
        },
        token_swap: {
          value_asset: 68.1564002479382,
          value_usd: 68.1564002479382 * fakePrice.priceUsd,
        },
      },
    });
  });

  async function getBlockWithTx(
    blockNumber: number,
    txHash: string,
  ): Promise<Block> {
    const block = await client.getBlock(blockNumber);
    block!.transactions = block!.transactions.filter((t) => t.hash == txHash);
    return block!;
  }
});
