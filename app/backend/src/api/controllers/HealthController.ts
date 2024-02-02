import { Request, Response } from "express";

export class HealthController {
  async getPing(req: Request, res: Response): Promise<void> {
    res.status(200).json({ ping: "pong" });
  }
}

export default HealthController;
