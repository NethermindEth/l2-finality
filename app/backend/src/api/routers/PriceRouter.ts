import { Router } from "express";
import { PricingController } from "@/api/controllers/PriceController"; // Adjust the import path as necessary

export function createPricingRouter(
  pricingController: PricingController,
): Router {
  const router: Router = Router();

  router.get(
    "/latest",
    pricingController.getLatestPrices.bind(pricingController),
  );

  return router;
}
