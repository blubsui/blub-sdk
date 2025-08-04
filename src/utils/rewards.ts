import { BLUB_COINTYPE } from "./constants";

export interface RewardCoin {
  symbol: string;
  coinType: string;
  logoUrl: string;
  decimals: number;
  monthlyReward: number;

  pendingReward?: number; // as number for easier display in frontend
}
export const rewardCoins: RewardCoin[] = [
  {
    symbol: "BLUB",
    logoUrl: "https://blubsui.com/favicon.ico",
    decimals: 2,
    coinType: BLUB_COINTYPE,
    monthlyReward: 200_000_000_000,
  },
  {
    //
    symbol: "DEEP",
    logoUrl:
      "https://wsrv.nl/?url=https%3A%2F%2Fimages.deepbook.tech%2Ficon.svg&w=48&h=48",
    decimals: 6,
    coinType:
      "0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP",
    monthlyReward: 10_000,
  },
  {
    symbol: "WAL",
    logoUrl:
      "https://cdn.prod.website-files.com/67bf314c789da9e4d7c30c50/67e504b174aa1dc487983468_67a0d056287d0398a93668ee_logo_icon_w%20(1).svg",
    decimals: 9,
    coinType:
      "0x356a26eb9e012a68958082340d4c4116e7f55615cf27affcff209cf0ae544f59::wal::WAL",
    monthlyReward: 2_912,
  },
];
