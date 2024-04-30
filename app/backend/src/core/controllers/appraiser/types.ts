import {
  BlockValueRecord,
  ValueRecord,
} from "@/database/repositories/BlockValueRepository";
import { ValueType } from "@/shared/api/viewModels/SyncStatusEndpoint";

export type ValueByType = {
  [type in ValueType]?: ValueRecord;
};

export type ValueByContract = {
  [contract: string]: ValueRecord | undefined;
};

export type ValueMapping = {
  byType?: ValueByType;
  byContract?: ValueByContract;
};

export function getValue(
  block: BlockValueRecord | undefined | null,
): ValueMapping {
  return block
    ? { byContract: block.value_by_contract, byType: block.value_by_type }
    : { byContract: {}, byType: {} };
}

export function mergeValues(
  mappings: ValueMapping[],
  ignoreZero: boolean = false,
): ValueMapping {
  const getZeroValue = () => ({ value_asset: 0, value_usd: 0 });
  const result: ValueMapping = {};

  for (const mapping of mappings) {
    const { byContract, byType } = mapping;

    if (byContract) {
      result.byContract ??= {};
      for (const contract of Object.keys(byContract)) {
        const newValue = {
          value_asset: byContract[contract]?.value_asset ?? 0,
          value_usd: byContract[contract]?.value_usd ?? 0,
        };

        if (ignoreZero && newValue.value_usd == 0) continue;

        const resValue =
          result.byContract[contract] ??
          (result.byContract[contract] = getZeroValue());

        resValue.value_asset += newValue.value_asset;
        resValue.value_usd += newValue.value_usd;
      }
    }

    if (byType) {
      result.byType ??= {};
      for (const typeStr of Object.keys(byType)) {
        const type = typeStr as any as ValueType;

        const newValue = {
          value_asset: byType[type]?.value_asset ?? 0,
          value_usd: byType[type]?.value_usd ?? 0,
        };

        if (ignoreZero && newValue.value_usd == 0) continue;

        const value =
          result.byType[type] ?? (result.byType[type] = getZeroValue());

        value.value_asset += newValue.value_asset;
        value.value_usd += newValue.value_usd;
      }
    }
  }

  return result;
}

export function mergeBlockValues(
  blocks: BlockValueRecord[],
  ignoreZero: boolean = false,
) {
  return mergeValues(blocks.map(getValue), ignoreZero);
}
