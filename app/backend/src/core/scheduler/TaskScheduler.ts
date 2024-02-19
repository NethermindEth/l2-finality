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

  start() {
    setImmediate(() => this.setInterval());

    this.intervalId = setInterval(() => this.setInterval(), this.intervalMs);
  }

  private setInterval() {
    if (!this.isTaskRunning) {
      this.isTaskRunning = true;
      this.executeTask()
        .catch((error) => {
          this.logger.error("Error in task:", error);
        })
        .finally(() => {
          this.isTaskRunning = false;
        });
    } else {
      this.logger.debug("Task is still running, skipping this interval.");
    }
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
