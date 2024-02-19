import { Router } from "express";
import { MetadataController } from "@/api/controllers/MetadataController";

export function createMetadataRouter(
  metadataController: MetadataController,
): Router {
  const router: Router = Router();

  router.get("/", metadataController.getAll.bind(metadataController));

  return router;
}
