import Logger from "@/tools/Logger";

export class TaskScheduler {
  private intervalMs: number;
  private task: () => Promise<void>;
  private intervalId: NodeJS.Timer | null;
  private readonly logger: Logger;
  private isTaskRunning: boolean;

  constructor(task: () => Promise<void>, intervalMs: number, logger: Logger) {
    this.task = task;
    this.intervalMs = intervalMs;
    this.intervalId = null;
    this.logger = logger;
    this.isTaskRunning = false;
  }

  async start() {
    if (this.isTaskRunning) {
      this.logger.debug("Task is already running, skipping this interval.");
      return;
    }

    try {
      this.isTaskRunning = true;
      await this.executeTask();
    } catch (error) {
      this.logger.error("Error in task:", error);
    } finally {
      this.isTaskRunning = false;
    }

    this.intervalId = setInterval(async () => {
      if (!this.isTaskRunning) {
        try {
          this.isTaskRunning = true;
          await this.executeTask();
        } catch (error) {
          this.logger.error("Error in task:", error);
        } finally {
          this.isTaskRunning = false;
        }
      } else {
        this.logger.debug("Task is still running, skipping this interval.");
      }
    }, this.intervalMs);
  }

  stop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId as NodeJS.Timeout);
      this.intervalId = null;
    }
    this.logger.info("TaskScheduler stopped");
  }

  private async executeTask() {
    await this.task();
  }
}

export default TaskScheduler;
