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
    "/interval",
    syncStatusController.getAverageSubmissionInterval.bind(
      syncStatusController,
    ),
  );

  router.get(
    "/var/history",
    syncStatusController.getAverageVarHistory.bind(syncStatusController),
  );

  router.get(
    "/var/active",
    syncStatusController.getActiveVar.bind(syncStatusController),
  );

  return router;
}
