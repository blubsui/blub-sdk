// src/builder/stakingBuilder.ts

import {
  Transaction,
  type TransactionObjectArgument,
} from "@mysten/sui/transactions";
import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";
import type {
  ClaimRewardParams,
  CloseStakePositionParams,
  CreateStakePositionAndStakeParams,
  CreateStakePositionParams,
  PreCalculatePendingRewardParams,
  RegisterRewardParams,
  StakeParams,
  UnStakeParams,
} from "../types";
import { getStakingObjectIds } from "../utils/config";

const {
  BLUB_STAKING_PACKAGE_ID,
  ADMIN_CAP_ID,
  PROTOCOL_CONFIG_ID,
  REWARD_MANAGER_ID,
  VAULT_ID,
} = getStakingObjectIds("mainnet");
/**
 * Builds staking transactions to be signed by the client
 */
export class StakingBuilder {
  /**
   * Builds a transaction to create an empty staking position for a user.
   * No coins are staked in this step — use `stake` or `createStakePositionAndStake` to deposit funds.
   *
   * Optional parameters with fallback:
   * - `protocolConfig` → defaults to PROTOCOL_CONFIG_ID
   * - `rewardManager` → defaults to REWARD_MANAGER_ID
   *
   * @param p - CreateStakePositionParams with optional overrides.
   * @param tx - Optional existing Transaction object (default: new Transaction()).
   * @returns The Transaction block and the newly created stake position object.
   */
  createStakePosition(
    p: CreateStakePositionParams,
    tx: Transaction = new Transaction()
  ): { tx: Transaction; position: TransactionObjectArgument } {
    const pos = tx.moveCall({
      target: `${BLUB_STAKING_PACKAGE_ID}::staking::create_stake_position`,
      arguments: [
        tx.object(p.protocolConfig ?? PROTOCOL_CONFIG_ID),
        tx.object(p.rewardManager ?? REWARD_MANAGER_ID),
      ],
    });
    return { tx, position: pos };
  }

  /**
   * Builds a transaction to stake additional coins into an existing staking position.
   *
   * Required parameters:
   * - `position`: The ID of the existing staking position.
   * - `coin`: The coin object to be staked (e.g. from `getCoins` or `selectCoin`).
   *
   * Optional parameters with fallback:
   * - `protocolConfig` → defaults to PROTOCOL_CONFIG_ID
   * - `vault` → defaults to VAULT_ID
   * - `rewardManager` → defaults to REWARD_MANAGER_ID
   *
   * @param params - StakeParams with required `position` and `coin`, plus optional overrides.
   * @param tx - Optional existing Transaction object (default: new Transaction()).
   * @returns The Transaction block with the stake call appended.
   */
  stake(params: StakeParams, tx: Transaction = new Transaction()) {
    tx.moveCall({
      target: `${BLUB_STAKING_PACKAGE_ID}::staking::stake`,
      arguments: [
        tx.object(params.protocolConfig ?? PROTOCOL_CONFIG_ID),
        tx.object(params.vault ?? VAULT_ID),
        tx.object(params.rewardManager ?? REWARD_MANAGER_ID),
        tx.object(params.position),
        params.coin,
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
    });
    return tx;
  }

  /**
   * Builds a transaction to create a new staking position and immediately stake coins into it.
   *
   * Required parameters:
   * - `coin`: The coin object to be staked (typically from `selectCoin` or `getCoins`).
   *
   * Optional parameters with fallback:
   * - `protocolConfig` → defaults to PROTOCOL_CONFIG_ID
   * - `rewardManager` → defaults to REWARD_MANAGER_ID
   * - `vault` → defaults to VAULT_ID
   *
   * @param params - CreateStakePositionAndStakeParams with required `coin` and optional overrides.
   * @param tx - Optional existing Transaction object (default: new Transaction()).
   * @returns The Transaction block and the created stake position object reference.
   */
  createStakePositionAndStake(
    params: CreateStakePositionAndStakeParams,
    tx: Transaction = new Transaction()
  ) {
    const position = tx.moveCall({
      target: `${BLUB_STAKING_PACKAGE_ID}::staking::create_stake_position_and_stake`,
      arguments: [
        tx.object(params.protocolConfig ?? PROTOCOL_CONFIG_ID),
        tx.object(params.rewardManager ?? REWARD_MANAGER_ID),
        tx.object(params.vault ?? VAULT_ID),
        params.coin,
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
    });
    return { tx, position };
  }

  /**
   * Builds a transaction to claim rewards for a given position and coin type.
   *
   * Required parameters:
   * - `position`: The user's staking position object ID.
   * - `coinType`: The reward coin type to claim (e.g., BLUB COIN type string).
   *
   * Optional parameters will fallback to default object IDs:
   * - `protocolConfig` → defaults to PROTOCOL_CONFIG_ID
   * - `vault` → defaults to VAULT_ID
   * - `rewardManager` → defaults to REWARD_MANAGER_ID
   *
   * @param params - ClaimRewardParams with required `position` and `coinType`, plus optional overrides.
   * @param tx - Optional existing Transaction object (default: new Transaction()).
   * @returns Transaction block and coin result object.
   */
  claimReward(params: ClaimRewardParams, tx: Transaction = new Transaction()) {
    const coin = tx.moveCall({
      target: `${BLUB_STAKING_PACKAGE_ID}::staking::claim_reward`,
      arguments: [
        tx.object(params.protocolConfig ?? PROTOCOL_CONFIG_ID),
        tx.object(params.vault ?? VAULT_ID),
        tx.object(params.rewardManager ?? REWARD_MANAGER_ID),
        tx.object(params.position),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
      typeArguments: [params.coinType],
    });
    return { tx, coin };
  }

  /**
   * Builds a transaction to unstake a specific amount from a staking position.
   *
   * Only `position` and `amount` are strictly required.
   * The following parameters are optional and fallback to defaults:
   * - `protocolConfig` → defaults to PROTOCOL_CONFIG_ID
   * - `vault` → defaults to VAULT_ID
   * - `rewardManager` → defaults to REWARD_MANAGER_ID
   *
   * @param params - UnStakeParams with required `position` and `amount`, plus optional overrides.
   * @param tx - Optional existing Transaction object (default: new Transaction()).
   * @returns Transaction block and coin result object.
   */
  unstake(params: UnStakeParams, tx: Transaction = new Transaction()) {
    const coin = tx.moveCall({
      target: `${BLUB_STAKING_PACKAGE_ID}::staking::unstake`,
      arguments: [
        tx.object(params.protocolConfig ?? PROTOCOL_CONFIG_ID),
        tx.object(params.vault ?? VAULT_ID),
        tx.object(params.rewardManager ?? REWARD_MANAGER_ID),
        tx.object(params.position),
        tx.pure.u64(params.amount),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
    });
    return { tx, coin };
  }

  /**
   * Builds a transaction to close an existing staking position.
   *
   * Required parameter:
   * - `position`: The ID of the stake position to be closed.
   *
   * Optional parameters with fallback:
   * - `protocolConfig` → defaults to PROTOCOL_CONFIG_ID
   * - `rewardManager` → defaults to REWARD_MANAGER_ID
   *
   * @param params - CloseStakePositionParams with required `position` and optional overrides.
   * @param tx - Optional existing Transaction object (default: new Transaction()).
   * @returns The Transaction block with the close position call appended.
   */
  closeStakePosition(
    params: CloseStakePositionParams,
    tx: Transaction = new Transaction()
  ) {
    tx.moveCall({
      target: `${BLUB_STAKING_PACKAGE_ID}::staking::close_stake_position`,
      arguments: [
        tx.object(params.protocolConfig ?? PROTOCOL_CONFIG_ID),
        tx.object(params.rewardManager ?? REWARD_MANAGER_ID),
        tx.object(params.position),
      ],
    });
    return tx;
  }

  /**
   * Builds a transaction to register a new reward emission for a given coin type.
   *
   * Required parameters:
   * - `rewardCoinType`: The coin type that will be distributed as rewards.
   * - `emissionRate`: Amount of tokens emitted per second (as `u64`).
   * - `startTime`: UNIX timestamp (in seconds) when the reward emission starts.
   * - `endTime`: UNIX timestamp (in seconds) when the reward emission ends.
   *
   * Optional parameters with fallback:
   * - `adminCap` → defaults to ADMIN_CAP_ID
   * - `protocolConfig` → defaults to PROTOCOL_CONFIG_ID
   * - `rewardManager` → defaults to REWARD_MANAGER_ID
   *
   * @param params - RegisterRewardParams with required and optional fields.
   * @param tx - Optional existing Transaction object (default: new Transaction()).
   * @returns The Transaction block with the register reward call appended.
   */
  registerReward(
    params: RegisterRewardParams,
    tx: Transaction = new Transaction()
  ) {
    tx.moveCall({
      target: `${BLUB_STAKING_PACKAGE_ID}::staking::register_reward`,
      arguments: [
        tx.object(params.adminCap ?? ADMIN_CAP_ID),
        tx.object(params.protocolConfig ?? PROTOCOL_CONFIG_ID),
        tx.object(params.rewardManager ?? REWARD_MANAGER_ID),
        tx.pure.u64(params.emissionRate),
        tx.pure.u64(params.startTime),
        tx.pure.u64(params.endTime),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
      typeArguments: [params.rewardCoinType],
    });
    return tx;
  }

  /**
   * Builds a transaction to calculate pending rewards for a specific coin type and staking position.
   * This transaction is typically used for off-chain simulation (e.g. via `devInspectTransactionBlock`).
   *
   * Required parameters:
   * - `position`: The staking position object ID to inspect.
   * - `coinType`: The coin type for which to calculate pending rewards.
   *
   * Optional parameters with fallback:
   * - `protocolConfig` → defaults to PROTOCOL_CONFIG_ID
   * - `rewardManager` → defaults to REWARD_MANAGER_ID
   *
   * @param params - PreCalculatePendingRewardParams with required `position` and `coinType`, plus optional overrides.
   * @param tx - Optional existing Transaction object (default: new Transaction()).
   * @returns The Transaction block with the pending reward calculation call appended.
   */
  calculatePendingReward(
    params: PreCalculatePendingRewardParams,
    tx: Transaction = new Transaction()
  ) {
    tx.moveCall({
      target: `${BLUB_STAKING_PACKAGE_ID}::staking::calculate_pending_reward`,
      arguments: [
        tx.object(params.protocolConfig ?? PROTOCOL_CONFIG_ID),
        tx.object(params.rewardManager ?? REWARD_MANAGER_ID),
        tx.object(params.position),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
      typeArguments: [params.coinType],
    });
    return tx;
  }
}
