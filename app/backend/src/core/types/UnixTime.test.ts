import { expect } from "earl";

import { UnixTime } from "./UnixTime";

describe("UnixTime.name", () => {
  [
    {ms: 1708316848000, res: 1708316848},
    {ms: 1708316848123, res: 1708316848},
    {ms: 1708316848789, res: 1708316848}
  ].forEach(testCase =>
    it("rounds down when constructed from milliseconds", () => {
      expect(new UnixTime(testCase.ms).toSeconds()).toEqual(testCase.res);
    })
  );

  it("shows seconds in template literal", () => {
    expect(`${new UnixTime(1708316848)}`).toEqual('1708316848');
  });

  it("cannot be constructed from too large numbers", () => {
    expect(() => new UnixTime(Date.now() * 1000 * 10)).toThrow(
      TypeError,
      "timestamp must represent time in seconds or milliseconds",
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
