import { UnixTime } from "@/core/types/UnixTime";

export type PriceEntry = { timestamp: UnixTime; price: number };
export type AssetPriceMap = { [id: string]: PriceEntry | undefined };
