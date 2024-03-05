import { Router } from "express";
import { SyncStatusController } from "@/api/controllers/SyncStatusController";

export function createSyncStatusRouter(
  syncStatusController: SyncStatusController,
): Router {
  const router: Router = Router();

  router.get(
    "/",
    syncStatusController.getPaginatedByChain.bind(syncStatusController),
  );

  router.get(
    "/diff",
    syncStatusController.getAvgDiffBySubmission.bind(syncStatusController),
  );

  return router;
}
