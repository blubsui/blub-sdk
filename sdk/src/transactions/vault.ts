// Copyright (c) Blub Labs, Inc.
// SPDX-License-Identifier: Apache-2.0
import type { Transaction } from "@mysten/sui/transactions";
import type { StakingConfig } from "../utils/config.js";
import {
  DepositRewardCoinParams,
  WithdrawRewardCoinParams,
} from "../types/params";

/**
 * VaultModule class for managing vault operations in BlubStaking.
 */
export class VaultModule {
  #config: StakingConfig;

  /**
   * @param {StakingConfig} config Configuration for BlubStaking
   */
  constructor(config: StakingConfig) {
    this.#config = config;
  }

  /**
   * @description Deposit a reward coin into the vault
   * @param {DepositRewardCoinParams} params Parameters for depositing a reward coin
   * @param {Transaction} tx Transaction object
   */
  depositRewardCoin(params: DepositRewardCoinParams, tx: Transaction) {
    const vault = params.vault ?? this.#config.VAULT_ID;

    tx.moveCall({
      target: `${this.#config.BLUB_STAKING_PACKAGE_ID}::vault::deposit_reward_coin`,
      arguments: [tx.object(vault), params.rewardCoin],
    });
  }

  /**
   * @description Unstake from the pool
   * @param {string} poolKey The key to identify the pool
   * @param {string} balanceManagerKey The key to identify the BalanceManager
   * @returns A function that takes a Transaction object
   */

  withdrawRewardCoin(
    params: WithdrawRewardCoinParams,
    recipient: string,
    tx: Transaction
  ) {
    const vault = params.vault ?? this.#config.VAULT_ID;
    const adminCap = params.adminCap ?? this.#config.ADMIN_CAP_ID;
    const amount = params.amount;

    const [coin] = tx.moveCall({
      target: `${this.#config.BLUB_STAKING_PACKAGE_ID}::vault::withdraw_reward_coin`,
      arguments: [tx.object(vault), tx.object(adminCap), tx.pure.u64(amount)],
      typeArguments: [params.coinType],
    });

    tx.transferObjects([coin], recipient);
  }
}
