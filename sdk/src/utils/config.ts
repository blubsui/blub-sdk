// Copyright (c) Blub Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { normalizeSuiAddress } from '@mysten/sui/utils';
import type { Environment, RewardConfig, RewardInfo } from '../types/index';
import {
	mainnetObjectIds,
	testnetObjectIds,
} from './constants';

export const GAS_BUDGET = 0.5 * 500000000; // Adjust based on benchmarking

export class StakingConfig {
	address: string;
	#rewardInfos: { [key: string]: RewardInfo };
	#rewardConfigs: { [key: string]: RewardConfig };

	BLUB_STAKING_PACKAGE_ID: string;
	ADMIN_CAP_ID: string;
	PROTOCOL_CONFIG_ID: string;
	REWARD_MANAGER_ID: string;
	VAULT_ID: string;

	constructor({
		env,
		address,
	}: {
		env: Environment;
		address: string;
	}) {
		this.address = normalizeSuiAddress(address);

		if (env === 'mainnet') {
			this.BLUB_STAKING_PACKAGE_ID = mainnetObjectIds.BLUB_STAKING_PACKAGE_ID;
			this.ADMIN_CAP_ID = mainnetObjectIds.ADMIN_CAP_ID;
			this.PROTOCOL_CONFIG_ID = mainnetObjectIds.PROTOCOL_CONFIG_ID;
			this.REWARD_MANAGER_ID = mainnetObjectIds.REWARD_MANAGER_ID;
			this.VAULT_ID = mainnetObjectIds.VAULT_ID;
		} else {
			this.BLUB_STAKING_PACKAGE_ID = testnetObjectIds.BLUB_STAKING_PACKAGE_ID;
			this.ADMIN_CAP_ID = testnetObjectIds.ADMIN_CAP_ID;
			this.PROTOCOL_CONFIG_ID = testnetObjectIds.PROTOCOL_CONFIG_ID;
			this.REWARD_MANAGER_ID = testnetObjectIds.REWARD_MANAGER_ID;
			this.VAULT_ID = testnetObjectIds.VAULT_ID;
		}

		this.#rewardInfos = {};
		this.#rewardConfigs = {};
	}

	// Getters
	getRewardInfo(key: string) {
		const info = this.#rewardInfos[key];
		if (!info) {
			throw new Error(`Reward info not found for key: ${key}`);
		}

		return info;
	}

	getRewardConfig(key: string) {
		const config = this.#rewardConfigs[key];
		if (!config) {
			throw new Error(`Reward config not found for key: ${key}`);
		}

		return config;
	}

	setRewardInfo(key: string, info: RewardInfo) {
		this.#rewardInfos[key] = info;
	}

	setRewardConfig(key: string, config: RewardConfig) {
		this.#rewardConfigs[key] = config;
	}
}
