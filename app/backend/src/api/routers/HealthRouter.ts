import { Router } from "express";
import { HealthController } from "@/api/controllers/HealthController";

export function createHealthRouter(healthController: HealthController): Router {
  const router: Router = Router();

  router.get("/", healthController.getPing.bind(healthController));

  return router;
}
