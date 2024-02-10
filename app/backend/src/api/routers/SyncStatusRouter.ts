import { Router } from "express";
import { SyncStatusController } from "../controllers/SyncStatusController";

export function createSyncStatusRouter(
  syncStatusController: SyncStatusController,
): Router {
  const router: Router = Router();

  router.get(
    "/",
    syncStatusController.getPaginatedByChain.bind(syncStatusController),
  );

  return router;
}
