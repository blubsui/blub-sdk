// Copyright (c) Blub Labs, Inc.
// SPDX-License-Identifier: Apache-2.0
import type {
  Transaction,
  TransactionObjectArgument,
} from "@mysten/sui/transactions";
import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";
import {
  ClaimRewardParams,
  CloseStakePositionParams,
  CreateStakePositionAndStakeParams,
  CreateStakePositionParams,
  PreCalculatePendingRewardParams,
  RegisterRewardParams,
  StakeParams,
  UnStakeParams,
} from "../types";
import { StakingConfig } from "../utils/config";

/**
 * StakingModule class for managing Staking operations.
 */
export class StakingModule {
  #config: StakingConfig;

  /**
   * @param {StakingConfig} config Configuration for DeepBookContract
   */
  constructor(config: StakingConfig) {
    this.#config = config;
  }

  /**
   * @description Register a reward
   * @param {RegisterRewardParams} params Parameters for registering a reward
   * @param {Transaction} tx Transaction object
   */
  registerRewardMoveCall(params: RegisterRewardParams, tx: Transaction) {
    const protocolConfig =
      params.protocolConfig ?? this.#config.PROTOCOL_CONFIG_ID;
    const rewardManager =
      params.rewardManager ?? this.#config.REWARD_MANAGER_ID;
    const adminCap = params.adminCap ?? this.#config.ADMIN_CAP_ID;

    tx.moveCall({
      target: `${this.#config.BLUB_STAKING_PACKAGE_ID}::staking::register_reward`,
      arguments: [
        tx.object(adminCap),
        tx.object(protocolConfig),
        tx.object(rewardManager),
        tx.pure.u64(params.emissionRate),
        tx.pure.u64(params.startTime),
        tx.pure.u64(params.endTime),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
      typeArguments: [params.rewardCoinType],
    });
  }

  /**
   * @description Create a stake position
   * @param {CreateStakePositionParams} params Parameters for creating a stake position
   * @param {Transaction} tx Transaction object
   */
  createStakePositonMoveCall(
    params: CreateStakePositionParams,
    tx: Transaction
  ): TransactionObjectArgument {
    const protocolConfig =
      params.protocolConfig ?? this.#config.PROTOCOL_CONFIG_ID;
    const rewardManager =
      params.rewardManager ?? this.#config.REWARD_MANAGER_ID;

    const position = tx.moveCall({
      target: `${this.#config.BLUB_STAKING_PACKAGE_ID}::staking::create_stake_position`,
      arguments: [tx.object(protocolConfig), tx.object(rewardManager)],
      typeArguments: [],
    });

    return position;
  }

  /**
   * @description Stake a coin
   * @param {StakeParams} params Parameters for staking a coin
   * @param {Transaction} tx Transaction object
   */
  stakeMoveCall(params: StakeParams, tx: Transaction) {
    const protocolConfig =
      params.protocolConfig ?? this.#config.PROTOCOL_CONFIG_ID;
    const rewardManager =
      params.rewardManager ?? this.#config.REWARD_MANAGER_ID;
    const vault = params.vault ?? this.#config.VAULT_ID;

    tx.moveCall({
      target: `${this.#config.BLUB_STAKING_PACKAGE_ID}::staking::stake`,
      arguments: [
        tx.object(protocolConfig),
        tx.object(vault),
        tx.object(rewardManager),
        tx.object(params.position),
        params.coin,
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
      typeArguments: [],
    });
  }

  /**
   * @description Create a stake position and stake a coin
   * @param {CreateStakePositionAndStakeParams} params Parameters for creating a stake position and staking a coin
   * @param {Transaction} tx Transaction object
   */
  createStakePositionAndStakeMoveCall(
    params: CreateStakePositionAndStakeParams,
    tx: Transaction
  ): TransactionObjectArgument {
    const protocolConfig =
      params.protocolConfig ?? this.#config.PROTOCOL_CONFIG_ID;
    const rewardManager =
      params.rewardManager ?? this.#config.REWARD_MANAGER_ID;
    const vault = params.vault ?? this.#config.VAULT_ID;

    const position = tx.moveCall({
      target: `${this.#config.BLUB_STAKING_PACKAGE_ID}::staking::create_stake_position_and_stake`,
      arguments: [
        tx.object(protocolConfig),
        tx.object(rewardManager),
        tx.object(vault),
        params.coin,
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
      typeArguments: [],
    });

    return position;
  }

  /**
   * @description Unstake a coin
   * @param {UnStakeParams} params Parameters for unstaking a coin
   * @param {Transaction} tx Transaction object
   */
  unstakeMoveCall(
    params: UnStakeParams,
    tx: Transaction
  ): TransactionObjectArgument {
    const protocolConfig =
      params.protocolConfig ?? this.#config.PROTOCOL_CONFIG_ID;
    const vault = params.vault ?? this.#config.VAULT_ID;
    const rewardManager =
      params.rewardManager ?? this.#config.REWARD_MANAGER_ID;

    const coin = tx.moveCall({
      target: `${this.#config.BLUB_STAKING_PACKAGE_ID}::staking::unstake`,
      arguments: [
        tx.object(protocolConfig),
        tx.object(vault),
        tx.object(rewardManager),
        tx.object(params.position),
        tx.pure.u64(params.amount),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
      typeArguments: [],
    });

    return coin;
  }

  /**
   * @description Claim reward
   * @param {ClaimRewardParams} params Parameters for claiming a reward
   * @param {Transaction} tx Transaction object
   */
  claimRewardMoveCall(
    params: ClaimRewardParams,
    tx: Transaction
  ): TransactionObjectArgument {
    const protocolConfig =
      params.protocolConfig ?? this.#config.PROTOCOL_CONFIG_ID;
    const vault = params.vault ?? this.#config.VAULT_ID;
    const rewardManager =
      params.rewardManager ?? this.#config.REWARD_MANAGER_ID;

    const coin = tx.moveCall({
      target: `${this.#config.BLUB_STAKING_PACKAGE_ID}::staking::claim_reward`,
      arguments: [
        tx.object(protocolConfig),
        tx.object(vault),
        tx.object(rewardManager),
        tx.object(params.position),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
      typeArguments: [params.coinType],
    });

    return coin;
  }

  /**
   * @description Close a stake position
   * @param {CloseStakePositionParams} params Parameters for closing a stake position
   * @param {Transaction} tx Transaction object
   */
  closeStakePositionMoveCall(
    params: CloseStakePositionParams,
    tx: Transaction
  ) {
    const protocolConfig =
      params.protocolConfig ?? this.#config.PROTOCOL_CONFIG_ID;
    const rewardManager =
      params.rewardManager ?? this.#config.REWARD_MANAGER_ID;
    const position = params.position;

    tx.moveCall({
      target: `${this.#config.BLUB_STAKING_PACKAGE_ID}::staking::close_stake_position`,
      arguments: [
        tx.object(protocolConfig),
        tx.object(rewardManager),
        tx.object(position),
      ],
      typeArguments: [],
    });
  }

  calculatePendingRewardMoveCall(
    params: PreCalculatePendingRewardParams,
    tx: Transaction
  ) {
    const protocolConfig =
      params.protocolConfig ?? this.#config.PROTOCOL_CONFIG_ID;
    const rewardManager =
      params.rewardManager ?? this.#config.REWARD_MANAGER_ID;
    const position = params.position;

    tx.moveCall({
      target: `${this.#config.BLUB_STAKING_PACKAGE_ID}::staking::calculate_pending_reward`,
      arguments: [
        tx.object(protocolConfig),
        tx.object(rewardManager),
        tx.object(position),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
      typeArguments: [params.coinType],
    });
  }
}
