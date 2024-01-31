import { expect } from "earl";

import { UnixTime } from "./UnixTime";

describe("UnixTime.name", () => {
  it("cannot be constructed from milliseconds", () => {
    expect(() => new UnixTime(Date.now())).toThrow(
      TypeError,
      "timestamp must represent time in seconds",
    );
  });

  it("cannot be constructed from non-integers", () => {
    expect(() => new UnixTime(6.9)).toThrow(
      TypeError,
      "timestamp must be an integer",
    );
  });

  it("cannot be constructed from negative integers", () => {
    expect(() => new UnixTime(-132)).toThrow(
      TypeError,
      "timestamp must be a positive integer",
    );
  });
});
