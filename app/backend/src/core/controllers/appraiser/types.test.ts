import { expect } from "earl";
import { mergeValues, ValueMapping } from "@/core/controllers/appraiser/types";
import { ValueType } from "@/shared/api/viewModels/SyncStatusEndpoint";

describe(mergeValues.name, () => {
  it("Sums identical contracts", async () => {
    const value1: ValueMapping = {
      byContract: {
        "0x0000000000000000000000000000000000000000": {
          value_asset: 1,
          value_usd: 4000,
        },
      },
    };

    const value2: ValueMapping = {
      byContract: {
        "0x0000000000000000000000000000000000000000": {
          value_asset: 3,
          value_usd: 12000,
        },
      },
    };

    const expected: ValueMapping = {
      byContract: {
        "0x0000000000000000000000000000000000000000": {
          value_asset: 4,
          value_usd: 16000,
        },
      },
    };

    expect(mergeValues([value1, value2])).toEqual(expected);
  });

  it("Combines different contracts", async () => {
    const value1: ValueMapping = {
      byContract: {
        "0x0000000000000000000000000000000000000000": {
          value_asset: 1,
          value_usd: 4000,
        },
      },
    };

    const value2: ValueMapping = {
      byContract: {
        "0x1111111111111111111111111111111111111111": {
          value_asset: 10,
          value_usd: 100,
        },
      },
    };

    const expected: ValueMapping = {
      byContract: {
        "0x0000000000000000000000000000000000000000": {
          value_asset: 1,
          value_usd: 4000,
        },
        "0x1111111111111111111111111111111111111111": {
          value_asset: 10,
          value_usd: 100,
        },
      },
    };

    expect(mergeValues([value1, value2])).toEqual(expected);
  });

  it("Sums identical types", async () => {
    const value1: ValueMapping = {
      byType: {
        [ValueType.native_transfer]: {
          value_asset: 1,
          value_usd: 4000,
        },
      },
    };

    const value2: ValueMapping = {
      byType: {
        [ValueType.native_transfer]: {
          value_asset: 3,
          value_usd: 12000,
        },
      },
    };

    const expected: ValueMapping = {
      byType: {
        [ValueType.native_transfer]: {
          value_asset: 4,
          value_usd: 16000,
        },
      },
    };

    expect(mergeValues([value1, value2])).toEqual(expected);
  });

  it("Combines different types", async () => {
    const value1: ValueMapping = {
      byType: {
        [ValueType.native_transfer]: {
          value_asset: 1,
          value_usd: 4000,
        },
      },
    };

    const value2: ValueMapping = {
      byType: {
        [ValueType.token_swap]: {
          value_asset: 10,
          value_usd: 100,
        },
      },
    };

    const expected: ValueMapping = {
      byType: {
        [ValueType.native_transfer]: {
          value_asset: 1,
          value_usd: 4000,
        },
        [ValueType.token_swap]: {
          value_asset: 10,
          value_usd: 100,
        },
      },
    };

    expect(mergeValues([value1, value2])).toEqual(expected);
  });
});
