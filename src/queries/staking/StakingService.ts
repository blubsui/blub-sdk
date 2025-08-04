import { defaultSuiClient } from "../../utils/client";
import { getStakingObjectIds } from "../../utils/config";
import { RewardCoin, rewardCoins } from "../../utils/rewards";
import {
  _calculatePendingReward,
  _getPositions,
  _getUserTotalStaked,
  _queryUserPositionIds,
  queryRewardManager,
} from "./StakingRepository";

const objectIds = getStakingObjectIds("mainnet");

export interface PositionInfo {
  positionId: string;
  staked: bigint;
  rewards: RewardCoin[];
}

export interface StakingSummary {
  totalStaked: bigint;
  positions: PositionInfo[];
}

/**
 * Returns a full staking summary for the given wallet:
 * - total staked amount
 * - every position (id, staked amount)
 * - pending rewards for each coinType listed in `rewardCoins`
 */

export async function getStakingSummary(
  wallet: string
): Promise<StakingSummary> {
  const rewardCoinMap = new Map<string, Omit<RewardCoin, "pendingReward">>();
  rewardCoins.forEach((c) => {
    rewardCoinMap.set(c.coinType, {
      symbol: c.symbol,
      coinType: c.coinType,
      logoUrl: c.logoUrl,
      decimals: c.decimals,
      monthlyReward: c.monthlyReward,
    });
  });

  const rewardManager = await queryRewardManager(
    defaultSuiClient,
    objectIds.REWARD_MANAGER_ID
  );
  if (!rewardManager) throw new Error("Failed to load reward manager.");

  const userPositionsRecordId = rewardManager.userPositionsRecordId;

  const totalStaked = await _getUserTotalStaked(
    defaultSuiClient,
    userPositionsRecordId,
    wallet
  );

  const positionIds = await _queryUserPositionIds(
    defaultSuiClient,
    userPositionsRecordId,
    wallet
  );

  if (!positionIds || positionIds.length === 0) {
    return { totalStaked, positions: [] };
  }

  const userPositions = await _getPositions(positionIds);
  if (!userPositions || userPositions.length === 0) {
    return { totalStaked, positions: [] };
  }

  const positionsWithRewards: PositionInfo[] = [];

  for (const pos of userPositions) {
    const rewards: RewardCoin[] = await Promise.all(
      rewardCoins.map(async (coin) => {
        try {
          const [pending] = await _calculatePendingReward(
            wallet,
            { position: pos.id, coinType: coin.coinType },
            objectIds.BLUB_STAKING_PACKAGE_ID,
            defaultSuiClient
          );

          const raw = pending?.pendingReward ?? BigInt(0);

          return {
            ...coin,
            pendingReward: Number(raw) / 10 ** coin.decimals,
          };
        } catch (err) {
          console.warn(`Error calculating reward for ${coin.symbol}`, err);

          return {
            ...coin,
            pendingReward: 0,
          };
        }
      })
    );

    positionsWithRewards.push({
      positionId: pos.id,
      staked: pos.stakedAmount,
      rewards,
    });
  }

  return {
    totalStaked,
    positions: positionsWithRewards,
  };
}
