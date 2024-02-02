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
    } else if (timestamp > this.YEAR_3000_TIMESTAMP) {
      throw new TypeError("timestamp must represent time in seconds");
    }
  }

  static now(): UnixTime {
    return new UnixTime(Math.floor(Date.now() / 1000));
  }

  static fromDate(date: Date): UnixTime {
    return new UnixTime(Math.floor(date.getTime() / 1000));
  }

  toDate(): Date {
    return new Date(this.timestamp * 1000);
  }
}
