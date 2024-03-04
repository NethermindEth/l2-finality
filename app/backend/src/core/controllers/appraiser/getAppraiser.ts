import { PriceRepository } from "@/database/repositories/PricingRepository";
import { Logger } from "@/tools/Logger";
import { Database } from "@/database/Database";
import { IBlockchainClient } from "@/core/clients/blockchain/IBlockchainClient";
import { BlockAppraiser } from "@/core/controllers/appraiser/BlockAppraiser";
import { BlockRewardsHandler } from "@/core/controllers/appraiser/handlers/BlockRewardsHandler";
import { TransferService } from "@/core/controllers/appraiser/services/TransferService";
import { NativeTransferHandler } from "@/core/controllers/appraiser/handlers/NativeTransfers";
import { TokenTransferHandler } from "@/core/controllers/appraiser/handlers/TokenTransfers";
import { PriceService } from "@/core/controllers/appraiser/services/PriceService";
import { Config } from "@/config";

export function createBlockAppraiser(
  blockchainClient: IBlockchainClient,
  config: Config,
  logger: Logger,
  database: Database,
): BlockAppraiser {
  const priceService = new PriceService(
    new PriceRepository(database.getKnex()),
    logger,
    config.indexers.useFakePricing,
  );

  if (config.indexers.useFakePricing) {
    logger.warn("Block Appraiser using fake pricing: 1 USD for all tokens");
  }

  const tokenService = new TokenTransferHandler(
    blockchainClient,
    logger,
    priceService,
  );

  const nativeService = new NativeTransferHandler(
    blockchainClient,
    logger,
    priceService,
  );

  const transferService = new TransferService(tokenService, nativeService);

  const blockRewardsHandler = new BlockRewardsHandler(priceService);

  return new BlockAppraiser(
    blockchainClient,
    transferService,
    blockRewardsHandler,
  );
}
