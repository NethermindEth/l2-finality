import express from "express";
import Logger from "../tools/Logger";
import { apiLogger } from "./middleware/apiLogger";
import { Database } from "../database/Database";
import { createHealthRouter } from "./routers/HealthRouter";
import HealthController from "./controllers/HealthController";
import { MetadataController } from "../api/controllers/MetadataController";
import MetadataRepository from "../database/repositories/MetadataRepository";
import { createMetadataRouter } from "../api/routers/MetadataRouter";

export class Api {
  private readonly app: express.Application;

  constructor(
    private readonly port: number,
    private readonly logger: Logger,
    private readonly database: Database,
  ) {
    this.logger = this.logger.for("Api");
    this.app = express();

    this.app.use(apiLogger);
    this.app.use(express.json());

    const metadataController = new MetadataController(
      new MetadataRepository(this.database.getKnex()),
      logger,
    );

    this.app.use("/api/metadata", createMetadataRouter(metadataController));
    this.app.use("/health", createHealthRouter(new HealthController()));
  }

  listen() {
    return new Promise<void>((resolve) => {
      this.app.listen(this.port, () => {
        this.logger.info(`Listening on port ${this.port}`);
        resolve();
      });
    });
  }
}
