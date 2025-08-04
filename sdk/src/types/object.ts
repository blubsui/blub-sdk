// Copyright (c) Blub Labs, Inc.
// SPDX-License-Identifier: Apache-2.0
export interface ProtocolConfig {
	id: string;
	version: bigint;
	openStaking: boolean;
	rewardConfigs: Map<string,RewardConfig>;
}

export interface RewardConfig {
	id: string;
	startTime: bigint;
	endTime: bigint;
	emissionRate: bigint;
	coinType: string;
}

export interface RewardInfo {
	rewardCoinType: string;
	accRewardPerShare: bigint;
	lastRewardTime: bigint;
}

export interface RewardManager {
	id: string;
	totalStakedAmount: bigint;
	rewardsInfos: Map<string, RewardInfo>;
	userPositionsRecordId: string;
}

export interface StakePosition {
	id: string;
	stakedAmount: bigint;
	rewardDebt: Map<string, bigint>;
	waitingClaimReward: Map<string, bigint>;
}

export interface Coin {
	address: string;
	type: string;
	scalar: number;
}

export interface PendingReward {
	coinType: string;
	pendingReward: bigint;
}

/**
 * Represents a coin asset with address, object ID, and balance information.
 */
export type CoinAsset = {
  /**
   * The address type of the coin asset.
   */
  coinAddress: string

  /**
   * The object identifier of the coin asset.
   */
  coinObjectId: string
	
  /**
   * The balance amount of the coin asset.
   */
  balance: bigint
}
