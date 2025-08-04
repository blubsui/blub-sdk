// src/queries/stakingService.ts

import type {
  PendingReward,
  PreCalculatePendingRewardParams,
  StakePosition,
} from "../../types";
import { defaultSuiClient } from "../../utils/client";
import { getStakingObjectIds } from "../../utils/config";
import {
  _getUserTotalStaked,
  _calculatePendingReward,
  _queryUserPositionIds,
  _getPositions,
} from "./StakingRepository";

const objectIds = getStakingObjectIds("mainnet");

/**
 * Retrieve all stake position IDs for a user.
 */
export async function getPositionIds(owner: string): Promise<string[] | null> {
  return _queryUserPositionIds(
    defaultSuiClient,
    objectIds.REWARD_MANAGER_ID,
    owner
  );
}

/**
 * Retrieve detailed stake positions for a list of IDs.
 */
export async function getPositions(
  positionIds: string[]
): Promise<StakePosition[] | null> {
  return _getPositions(defaultSuiClient, positionIds);
}

/**
 * Get total staked amount for a user.
 */
export async function getUserTotalStaked(owner: string): Promise<bigint> {
  return _getUserTotalStaked(
    defaultSuiClient,
    objectIds.PROTOCOL_CONFIG_ID,
    owner
  );
}

/**
 * Simulates the calculation of pending rewards for a given staking position and coin type.
 *
 * Required in `params`: `position`, `coinType`
 *
 * @param owner - The wallet address to simulate as the sender.
 * @param params - PreCalculatePendingRewardParams
 * @returns List of pending rewards with coin type and amount.
 */
export async function calculatePendingReward(
  owner: string,
  params: PreCalculatePendingRewardParams
): Promise<PendingReward[]> {
  return _calculatePendingReward(
    defaultSuiClient,
    owner,
    params,
    objectIds.BLUB_STAKING_PACKAGE_ID
  );
}
