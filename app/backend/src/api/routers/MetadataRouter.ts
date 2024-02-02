import { Router } from "express";
import { MetadataController } from "../controllers/MetadataController";

export function createMetadataRouter(
  metadataController: MetadataController,
): Router {
  const router: Router = Router();

  router.get("/", metadataController.getAll.bind(metadataController));

  return router;
}
