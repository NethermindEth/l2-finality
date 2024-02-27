import { z } from "zod";

const PositiveNumber = z.number().min(0);

export class UnixTime {
  private YEAR_3000_TIMESTAMP: number = Math.floor(
    new Date("3000-01-01T00:00:00.000Z").getTime() / 1000,
  );

  constructor(private readonly timestamp: number) {
    if (!Number.isInteger(timestamp)) {
      throw new TypeError("timestamp must be an integer");
    } else if (!PositiveNumber.safeParse(timestamp).success) {
      throw new TypeError("timestamp must be a positive integer");
    } else if (timestamp > this.YEAR_3000_TIMESTAMP * 1000) {
      throw new TypeError(
        "timestamp must represent time in seconds or milliseconds",
      );
    } else if (timestamp > this.YEAR_3000_TIMESTAMP) {
      this.timestamp = Math.floor(timestamp / 1000);
    }
  }

  static DAY = 86_400;

  static HOUR = 3_600;

  static MINUTE = 60;

  static now(): UnixTime {
    return new UnixTime(Math.floor(Date.now() / 1000));
  }

  static fromDate(date: Date): UnixTime {
    return new UnixTime(Math.floor(date.getTime() / 1000));
  }

  toDate(): Date {
    return new Date(this.timestamp * 1000);
  }

  toSeconds(): number {
    return this.timestamp;
  }

  toMinutes(): number {
    return this.timestamp / 60;
  }

  toString(): string {
    return this.timestamp.toString();
  }

  toISOString(): string {
    return this.toDate().toISOString();
  }

  add(
    value: number,
    period: "days" | "hours" | "minutes" | "seconds",
  ): UnixTime {
    if (!Number.isInteger(value)) {
      throw new TypeError("value must be an integer");
    }
    const unit =
      period === "days"
        ? UnixTime.DAY
        : period === "hours"
          ? UnixTime.HOUR
          : period === "minutes"
            ? UnixTime.MINUTE
            : 1;
    return new UnixTime(this.timestamp + value * unit);
  }
}

export type TimeRange = {
  from: UnixTime;
  to: UnixTime;
};
