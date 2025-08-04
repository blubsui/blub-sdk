import {
  Transaction,
  TransactionObjectArgument,
} from "@mysten/sui/transactions";

import { CoinUtils } from "./CoinAssist";
import { CoinAsset } from "../types";

export function mintZeroCoin(
  txb: Transaction,
  coinType: string
): TransactionObjectArgument {
  return txb.moveCall({
    target: "0x2::coin::zero",
    typeArguments: [coinType],
  });
}

export type BuildCoinResult = {
  targetCoin: TransactionObjectArgument;
  isMintZeroCoin: boolean;
  targetCoinAmount: number;
};

export function buildInputCoin(
  txb: Transaction,
  allCoins: CoinAsset[],
  amount: bigint,
  coinType: string
): BuildCoinResult {
  const usedCoinAsests = CoinUtils.getCoinAssets(coinType, allCoins);
  if (amount === BigInt(0)) {
    if (
      CoinUtils.isSuiCoin(coinType) ||
      (usedCoinAsests.length === 0 && !CoinUtils.isSuiCoin(coinType))
    ) {
      const zeroCoin = mintZeroCoin(txb, coinType);
      return {
        targetCoin: zeroCoin,
        isMintZeroCoin: true,
        targetCoinAmount: 0,
      };
    } else {
      return {
        targetCoin: txb.object(usedCoinAsests[0].coinObjectId),
        isMintZeroCoin: false,
        targetCoinAmount: Number(usedCoinAsests[0].balance.toString()),
      };
    }
  }

  const totalCoinBalance = CoinUtils.calculateTotalBalance(usedCoinAsests);
  if (totalCoinBalance < amount) {
    throw new Error(
      "Insufficient balance when build merge coin, coinType: " + coinType
    );
  }

  if (CoinUtils.isSuiCoin(coinType)) {
    const resultCoin = txb.splitCoins(txb.gas, [
      txb.pure.u64(amount.toString()),
    ]);
    return {
      targetCoin: resultCoin,
      isMintZeroCoin: true,
      targetCoinAmount: Number(amount.toString()),
    };
  }

  // sort used coin by amount, asc
  let sortCoinAssets = CoinUtils.sortByBalance(usedCoinAsests);

  // find first three coin if greater than amount
  const totalThreeCoinBalance = sortCoinAssets
    .slice(0, 3)
    .reduce((acc, coin) => acc + coin.balance, BigInt(0));
  if (totalThreeCoinBalance < BigInt(amount)) {
    sortCoinAssets = CoinUtils.sortByBalanceDes(usedCoinAsests);
  }

  const selectedCoinResult = CoinUtils.selectCoinObjectIdGreaterThanOrEqual(
    sortCoinAssets,
    amount
  );
  const [masterCoin, ...mergedCoin] = selectedCoinResult.objectArray;

  if (mergedCoin.length > 0) {
    txb.mergeCoins(
      masterCoin,
      mergedCoin.map((coin) => txb.object(coin))
    );
  }

  const targetCoin = txb.splitCoins(txb.object(masterCoin), [
    txb.pure.u64(amount.toString()),
  ]);

  return {
    targetCoin,
    isMintZeroCoin: false,
    targetCoinAmount: Number(amount.toString()),
  };
}
