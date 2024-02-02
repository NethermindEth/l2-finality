type LogLevel = "debug" | "info" | "warn" | "error";

interface LoggerOptions {
  logLevel: LogLevel;
}

export class Logger {
  private readonly logLevel: LogLevel;
  private context?: string;

  constructor(options?: Partial<LoggerOptions>, context?: string) {
    this.logLevel = options?.logLevel || "info";
    this.context = context;
  }

  for(context: string): Logger {
    return new Logger({ logLevel: this.logLevel }, context);
  }

  private formatLogMessage(
    level: LogLevel,
    message: string,
    args: any[],
  ): string {
    const now: Date = new Date();
    const timestamp: string = now.toISOString();
    const context: string = this.context
      ? `[${this.context.toUpperCase()}]`
      : "";
    return `[${timestamp}] [${level.toUpperCase()}] ${context}: ${message}`;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ["debug", "info", "warn", "error"];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog("debug")) {
      const logMessage = this.formatLogMessage("debug", message, args);
      console.debug(logMessage, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog("info")) {
      const logMessage = this.formatLogMessage("info", message, args);
      console.info(logMessage, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog("warn")) {
      const logMessage = this.formatLogMessage("warn", message, args);
      console.warn(logMessage, ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog("error")) {
      const logMessage = this.formatLogMessage("error", message, args);
      console.error(logMessage, ...args);
    }
  }
}

export default Logger;
