import { Response } from "express";

export function sendSuccessResponse(res: Response, data: any) {
  res.status(200).json({ success: true, data });
}

export function sendErrorResponse(
  res: Response,
  statusCode: number,
  errorMessage: string,
) {
  res.status(statusCode).json({ success: false, error: errorMessage });
}
