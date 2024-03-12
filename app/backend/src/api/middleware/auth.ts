import { Request, Response, NextFunction } from "express";
import { sendErrorResponse } from "@/api/utils/responseUtils";
import { Config } from "@/config";

export const authenticateApiKey = (config: Config) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const apiKey: string | undefined = req.headers["x-api-key"] as string;
    if (!apiKey) {
      return sendErrorResponse(res, 401, "Unauthorized");
    }
    if (apiKey !== config.api.apiKey) {
      return sendErrorResponse(res, 403, "Forbidden");
    }
    next();
  };
};
