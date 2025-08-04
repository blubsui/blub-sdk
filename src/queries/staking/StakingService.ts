// src/queries/staking/stakingService.ts
import { defaultSuiClient } from "../../utils/client";
import { getStakingObjectIds } from "../../utils/config";
import {
  _calculatePendingReward,
  _getPositions,
  _getUserTotalStaked,
  _queryRewardManager,
  _queryUserPositionIds,
} from "./StakingRepository";

const obj = getStakingObjectIds("mainnet");

export interface RewardInfo {
  coinType: string;
  pendingReward: bigint;
}

export interface PositionInfo {
  positionId: string;
  staked: bigint;
  pendingRewards: RewardInfo[];
}

export interface StakingSummary {
  totalStaked: bigint;
  positions: PositionInfo[];
}

/**
 * Returns a full staking summary for the given wallet:
 * - total staked amount
 * - every position (id, staked amount)
 * - pending rewards for each reward coin configured on‑chain
 *
 * This is **zero‑parameter** for the consumer – they only pass the wallet address.
 */
export async function getStakingSummary(
  wallet: string
): Promise<StakingSummary> {
  // ── 1. Global figures ───────────────────────────────────────────────
  const rewardManager = await _queryRewardManager(
    defaultSuiClient,
    obj.REWARD_MANAGER_ID
  );
  const rewardCoins: string[] = rewardManager.rewardCoins; // <- pulled from on‑chain object
  const totalStaked = await _getUserTotalStaked(
    defaultSuiClient,
    obj.PROTOCOL_CONFIG_ID,
    wallet
  );

  // ── 2. User positions ───────────────────────────────────────────────
  const positionIds = await _queryUserPositionIds(
    defaultSuiClient,
    obj.REWARD_MANAGER_ID,
    wallet
  );
  if (!positionIds || positionIds.length === 0) {
    return { totalStaked, positions: [] };
  }

  const userPositions = await _getPositions(defaultSuiClient, positionIds);
  if (!userPositions) {
    return { totalStaked, positions: [] };
  }

  // ── 3. Pending‑reward matrix (positions × coins) ────────────────────
  const positionsWithPending: PositionInfo[] = [];

  for (const pos of userPositions) {
    const pendingRewards: RewardInfo[] = await Promise.all(
      rewardCoins.map(async (coinType) => {
        const [reward] = await _calculatePendingReward(
          defaultSuiClient,
          wallet,
          { position: pos.id, coinType },
          obj.BLUB_STAKING_PACKAGE_ID
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

  return { totalStaked, positions: positionsWithPending };
}
