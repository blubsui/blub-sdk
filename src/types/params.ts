// Copyright (c) Blub Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import type { TransactionObjectArgument } from "@mysten/sui/transactions"

// ======== Config Module ========
export interface StartStakingParams {
	adminCap?: string;
	protocolConfig?: string;
}

export interface StopStakingParams {
	adminCap?: string;
	protocolConfig?: string;
}

export interface UpdatePackageVersionParams {
	version: bigint;
	adminCap?: string;
	protocolConfig?: string;
}

export interface CheckIsAllowStakingParams {
	protocolConfig?: string;
}

// ======== Staking Module ========
export interface CalculatePendingRewardParams {
	position: string;
	rewardCoinType: string;
	protocolConfig?: string;
	rewardManager?: string;
}

export interface CalculateAllPendingRewardsParams {
	position: string;
	protocolConfig?: string;
	rewardManager?: string;
}

export interface RegisterRewardParams {
	rewardCoinType: string;
	emissionRate: bigint;
	startTime: bigint;
	endTime: bigint;
	adminCap?: string;
	protocolConfig?: string;
	rewardManager?: string;
}

export interface CreateStakePositionParams {
	protocolConfig?: string;
	rewardManager?: string;
}

export interface CreateStakePositionAndStakeParams {
	coin: TransactionObjectArgument;
	protocolConfig?: string;
	vault?: string;
	rewardManager?: string;
}

export interface StakeParams {
	position: string;
	coin: TransactionObjectArgument;
	protocolConfig?: string;
	vault?: string;
	rewardManager?: string;
}

export interface UnStakeParams {
	position: string;
	amount: bigint;
	protocolConfig?: string;
	vault?: string;
	rewardManager?: string;
}

export interface ClaimRewardParams {
	position: string;
	coinType: string;
	protocolConfig?: string;
	vault?: string;
	rewardManager?: string;
}

export interface CloseStakePositionParams {
	position: string;
	protocolConfig?: string;
	rewardManager?: string;
}

export interface PreCalculatePendingRewardParams {
	position: string;
	coinType: string;
	protocolConfig?: string;
	rewardManager?: string;
}

// ======== Vault Module ========
export interface DepositRewardCoinParams {
	rewardCoin: TransactionObjectArgument;
	vault?: string;
}

export interface WithdrawRewardCoinParams {
	amount: bigint;
	coinType: string;
	vault?: string;
	adminCap?: string;
}

