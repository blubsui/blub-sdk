import type { PendingReward, RewardInfo, StakePosition } from "../../types";
import { defaultSuiClient } from "../../utils/client";
import { getStakingObjectIds } from "../../utils/config";
import {
  _getUserTotalStaked,
  _calculatePendingReward,
  _queryUserPositionIds,
  _getPositions,
  queryRewardManager, // ✅ usa sua versão real
} from "./StakingRepository";

const objectIds = getStakingObjectIds("mainnet");

export interface PositionInfo {
  positionId: string;
  staked: bigint;
  pendingRewards: PendingReward[];
}

export interface StakingSummary {
  totalStaked: bigint;
  positions: PositionInfo[];
}

/**
 * Returns a full staking summary for the given wallet:
 * - total staked amount
 * - every position (id, staked amount)
 * - pending rewards for each coinType listed in rewardsInfos
 */
export async function getStakingSummary(
  wallet: string
): Promise<StakingSummary> {
  // ── 1. Load reward manager to extract reward coinTypes ─────────────────
  const rewardManager = await queryRewardManager(
    defaultSuiClient,
    objectIds.REWARD_MANAGER_ID
  );
  if (!rewardManager) {
    throw new Error("Failed to load reward manager.");
  }

  const coinTypes = Array.from(rewardManager.rewardsInfos.keys());

  // ── 2. Get total staked value ──────────────────────────────────────────
  const totalStaked = await _getUserTotalStaked(
    defaultSuiClient,
    objectIds.PROTOCOL_CONFIG_ID,
    wallet
  );

  // ── 3. Load all positions ──────────────────────────────────────────────
  const positionIds = await _queryUserPositionIds(
    defaultSuiClient,
    objectIds.REWARD_MANAGER_ID,
    wallet
  );
  if (!positionIds || positionIds.length === 0) {
    return { totalStaked, positions: [] };
  }

  const userPositions = await _getPositions(defaultSuiClient, positionIds);
  if (!userPositions || userPositions.length === 0) {
    return { totalStaked, positions: [] };
  }

  // ── 4. Fetch pending rewards per position × coin ───────────────────────
  const positionsWithPending: PositionInfo[] = [];

  for (const pos of userPositions) {
    const pendingRewards: PendingReward[] = await Promise.all(
      coinTypes.map(async (coinType) => {
        const [reward] = await _calculatePendingReward(
          defaultSuiClient,
          wallet,
          { position: pos.id, coinType },
          objectIds.BLUB_STAKING_PACKAGE_ID
        );
        return {
          coinType,
          pendingReward: reward ? reward.pendingReward : 0n,
        };
      })
    );

    positionsWithPending.push({
      positionId: pos.id,
      staked: pos.stakedAmount,
      pendingRewards,
    });
  }

  return {
    totalStaked,
    positions: positionsWithPending,
  };
}
