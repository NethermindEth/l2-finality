import express from "express";
import Logger from "@/tools/Logger";
import { apiLogger } from "@/api/middleware/apiLogger";
import { Database } from "@/database/Database";
import { createHealthRouter } from "@/api/routers/HealthRouter";
import HealthController from "@/api/controllers/HealthController";
import { MetadataController } from "@/api/controllers/MetadataController";
import MetadataRepository from "@/database/repositories/MetadataRepository";
import { createMetadataRouter } from "@/api/routers/MetadataRouter";
import { SyncStatusController } from "@/api/controllers/SyncStatusController";
import SyncStatusRepository from "@/database/repositories/SyncStatusRepository";
import { createSyncStatusRouter } from "@/api/routers/SyncStatusRouter";
import { PricingController } from "@/api/controllers/PriceController";
import { PriceRepository } from "@/database/repositories/PricingRepository";
import { createPricingRouter } from "@/api/routers/PriceRouter";
import { createBlockValueRouter } from "@/api/routers/BlockValueRouter";
import { BlockValueController } from "@/api/controllers/BlockValueController";
import BlockValueRepository from "@/database/repositories/BlockValueRepository";
import cors from "cors";
import { authenticateApiKey } from "@/api/middleware/auth";
import { Config } from "@/config";

export class Api {
  private readonly app: express.Application;

  constructor(
    private readonly config: Config,
    private readonly logger: Logger,
    private readonly database: Database,
  ) {
    this.config = config;
    this.logger = this.logger.for("Api");
    this.app = express();

    this.app.use(
      cors({
        origin: "*",
        allowedHeaders: "*",
      }),
    );
    this.app.use(apiLogger);
    this.app.use(authenticateApiKey(this.config));
    this.app.use(express.json());

    const metadataController = new MetadataController(
      new MetadataRepository(this.database.getKnex()),
      logger,
    );
    const blockValueController = new BlockValueController(
      new BlockValueRepository(this.database.getKnex()),
      this.logger,
    );
    const syncStatusController = new SyncStatusController(
      new SyncStatusRepository(this.database.getKnex()),
      this.logger,
    );
    const pricingController = new PricingController(
      new PriceRepository(this.database.getKnex()),
      this.logger,
    );

    this.app.use("/api/metadata", createMetadataRouter(metadataController));
    this.app.use("/api/blocks", createBlockValueRouter(blockValueController));
    this.app.use("/api/prices", createPricingRouter(pricingController));
    this.app.use("/api/state", createSyncStatusRouter(syncStatusController));
    this.app.use("/api/health", createHealthRouter(new HealthController()));
  }

  listen() {
    return new Promise<void>((resolve) => {
      this.app.listen(this.config.api.port, () => {
        this.logger.info(`Listening on port ${this.config.api.port}`);
        resolve();
      });
    });
  }
}
