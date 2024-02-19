import { Router } from "express";
import { BlockValueController } from "@/api/controllers/BlockValueController";

export function createBlockValueRouter(
  blockValueController: BlockValueController,
): Router {
  const router: Router = Router();

  router.get(
    "/latest",
    blockValueController.getLatestBlockDetails.bind(blockValueController),
  );

  return router;
}
