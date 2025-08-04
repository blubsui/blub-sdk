// Copyright (c) Blub Labs, Inc.
// SPDX-License-Identifier: Apache-2.0
import type { SuiClient } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import dotenv from "dotenv";
import {
  queryProtocolConfig,
  queryRewardConfigByCoinType,
} from "./query/config";

import { queryRewardInfo, queryRewardManager } from "./query/reward";
import {
  getUserTotalStaked,
  queryUserPositionIds,
  queryUserPositions,
} from "./query/staking";
import { ConfigModule } from "./transactions/config";
import { StakingModule } from "./transactions/staking";
import { VaultModule } from "./transactions/vault";
import {
  ClaimRewardParams,
  CloseStakePositionParams,
  CoinAsset,
  CreateStakePositionParams,
  Environment,
  PendingReward,
  PreCalculatePendingRewardParams,
  RegisterRewardParams,
  StartStakingParams,
  StopStakingParams,
  UnStakeParams,
  UpdatePackageVersionParams,
} from "./types";
import { buildInputCoin } from "./utils/coin";
import { StakingConfig } from "./utils/config";
import { extractStructTagFromType } from "./utils/contract";

dotenv.config();

/**
 * StakingClient class for managing  Staking operations.
 */
export class StakingClient {
  client: SuiClient;
  #config: StakingConfig;
  #address: string;
  config: ConfigModule;
  vault: VaultModule;
  staking: StakingModule;
  private allCoins: Map<string, CoinAsset[]>;
  private keypair?: Ed25519Keypair;

  /**
   * @param {SuiClient} client SuiClient instance
   * @param {string} address Address of the client
   * @param {Environment} env Environment configuration
   */
  constructor({
    client,
    env,
    address,
  }: {
    client: SuiClient;
    env: Environment;
    address: string;
  }) {
    this.client = client;
    this.#address = address;
    // console.log("Activate wallet address:", this.#address);
    this.#config = new StakingConfig({
      address: this.#address,
      env,
    });
    this.config = new ConfigModule(this.#config, client);
    this.vault = new VaultModule(this.#config);
    this.staking = new StakingModule(this.#config);
    this.allCoins = new Map<string, CoinAsset[]>();
  }

  get address() {
    return this.#address;
  }

  // buildAccount() {
  //   if (process.env.SUI_WALLET_SECRET) {
  //     const secret = process.env.SUI_WALLET_SECRET;
  //     const keypair = Ed25519Keypair.fromSecretKey(
  //       fromBase64(secret).slice(1, 33)
  //     );
  //     this.keypair = keypair;
  //   }

  //   if (process.env.SUI_WALLET_PHRASE) {
  //     const phrase = process.env.SUI_WALLET_PHRASE;
  //     const keypair = Ed25519Keypair.deriveKeypair(phrase);
  //     this.keypair = keypair;
  //   }

  //   throw new Error("No wallet secret or phrase found");
  // }

  async signAndExecuteTransaction(txb: Transaction) {
    const res = await this.client.signAndExecuteTransaction({
      transaction: txb,
      signer: this.keypair!,
      options: {
        showEffects: true,
        showEvents: true,
        showInput: true,
        showBalanceChanges: true,
      },
    });
    return res;
  }

  async devInspectTransactionBlock(txb: Transaction) {
    const res = await this.client.devInspectTransactionBlock({
      transactionBlock: txb,
      sender: this.#address,
    });

    return res;
  }

  async sendTransaction(txb: Transaction) {
    const devInspectRes = await this.devInspectTransactionBlock(txb);
    if (devInspectRes.effects.status.status !== "success") {
      // console.log("transaction failed");
      // console.log(devInspectRes);
      return;
    }

    const txRes = await this.signAndExecuteTransaction(txb);
    // console.log(txRes);
    return txRes;
  }

  async getCoins(
    coinType: string,
    refresh: boolean = true
  ): Promise<CoinAsset[]> {
    if (this.#address === "") {
      throw new Error("Signer is required, but not provided.");
    }

    let cursor: any = null;
    const limit = 50;

    if (!refresh) {
      const gotFromCoins = this.allCoins.get(coinType);
      if (gotFromCoins) {
        return gotFromCoins;
      }
    }

    const allCoins: CoinAsset[] = [];
    while (true) {
      const gotCoins = await this.client.getCoins({
        owner: this.#address,
        coinType,
        cursor,
        limit,
      });
      for (const coin of gotCoins.data) {
        allCoins.push({
          coinAddress: extractStructTagFromType(coin.coinType).source_address,
          coinObjectId: coin.coinObjectId,
          balance: BigInt(coin.balance),
        });
      }
      if (gotCoins.data.length < limit) {
        break;
      }
      cursor = gotCoins.data[limit - 1].coinObjectId;
    }

    this.allCoins.set(coinType, allCoins);
    return allCoins;
  }

  startStaking(params: StartStakingParams, txb?: Transaction): Transaction {
    const tx = txb ?? new Transaction();
    this.config.startStakingMoveCall(params, tx);
    return tx;
  }

  stopStaking(params: StopStakingParams, txb?: Transaction): Transaction {
    const tx = txb ?? new Transaction();
    this.config.stopStakingMoveCall(params, tx);
    return tx;
  }

  updatePackageVersion(
    params: UpdatePackageVersionParams,
    txb?: Transaction
  ): Transaction {
    const tx = txb ?? new Transaction();
    this.config.updatePackageVersionMoveCall(params, tx);
    return tx;
  }

  async getProtocolConfig(protocolConfigId?: string) {
    return this.config.get_protocol_config(protocolConfigId);
  }

  registerReward(params: RegisterRewardParams, txb?: Transaction): Transaction {
    const tx = txb ?? new Transaction();
    this.staking.registerRewardMoveCall(params, tx);
    return tx;
  }

  createStakePosition(
    params: CreateStakePositionParams,
    txb?: Transaction
  ): Transaction {
    const tx = txb ?? new Transaction();
    const position = this.staking.createStakePositonMoveCall(params, tx);
    tx.transferObjects([position], this.#address);
    return tx;
  }

  async stake(
    coinType: string,
    amount: bigint,
    positionId?: string,
    txb?: Transaction
  ): Promise<Transaction> {
    const tx = txb ?? new Transaction();

    const userPositionIds = await this.queryUserPositionIds();
    if ((userPositionIds && userPositionIds.length > 0) || !positionId) {
      const allCoins = await this.getCoins(coinType);
      const inputCoin = buildInputCoin(tx, allCoins, amount, coinType);
      if (!positionId) {
        positionId = userPositionIds![0];
      }
      this.staking.stakeMoveCall(
        {
          position: positionId,
          coin: inputCoin.targetCoin,
        },
        tx
      );
      return tx;
    } else {
      const tx = await this.createStakePositionAndStake(coinType, amount);
      return tx;
    }
  }

  claimReward(params: ClaimRewardParams, txb?: Transaction): Transaction {
    const tx = txb ?? new Transaction();
    const coin = this.staking.claimRewardMoveCall(params, tx);
    tx.transferObjects([coin], this.#address);
    return tx;
  }

  async createStakePositionAndStake(
    coinType: string,
    amount: bigint,
    txb?: Transaction
  ): Promise<Transaction> {
    const tx = txb ?? new Transaction();
    const allCoins = await this.getCoins(coinType);
    const inputCoin = buildInputCoin(tx, allCoins, amount, coinType);
    const position = this.staking.createStakePositionAndStakeMoveCall(
      {
        coin: inputCoin.targetCoin,
      },
      tx
    );
    tx.transferObjects([position], this.#address);
    return tx;
  }

  unstake(params: UnStakeParams, txb?: Transaction): Transaction {
    const tx = txb ?? new Transaction();
    const coin = this.staking.unstakeMoveCall(params, tx);
    tx.transferObjects([coin], this.#address);
    return tx;
  }

  closeStakePosition(
    params: CloseStakePositionParams,
    txb?: Transaction
  ): Transaction {
    const tx = txb ?? new Transaction();
    this.staking.closeStakePositionMoveCall(params, tx);
    return tx;
  }

  async calculatePendingReward(
    params: PreCalculatePendingRewardParams,
    txb?: Transaction
  ): Promise<PendingReward[]> {
    const tx = txb ?? new Transaction();
    this.staking.calculatePendingRewardMoveCall(params, tx);

    const res = await this.devInspectTransactionBlock(tx);
    const events = res.events;

    const pendingRewards: PendingReward[] = [];
    for (const event of events) {
      if (
        event.type ===
        `${
          this.#config.BLUB_STAKING_PACKAGE_ID
        }::events::CalculatePendingRewardEvent`
      ) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pendingReward = event.parsedJson as any;
        pendingRewards.push({
          coinType: pendingReward.reward_info.coin_type.name,
          pendingReward: BigInt(
            pendingReward.reward_info.pending_reward_amount
          ),
        });
      }
    }
    return pendingRewards;
  }

  // ======================== QUERY ========================
  // async queryRewardConfigByCoinType(rewardCoinType: string) {
  // 	return queryRewardConfig(this.client, this.#config.PROTOCOL_CONFIG_ID, rewardCoinType)
  // }

  async queryProtocolConfig() {
    return queryProtocolConfig(this.client, this.#config.PROTOCOL_CONFIG_ID);
  }

  async queryRewardConfigs() {
    const protocolConfig = await queryProtocolConfig(
      this.client,
      this.#config.PROTOCOL_CONFIG_ID
    );
    return protocolConfig.rewardConfigs;
  }

  async queryRewardConfigByCoinType(rewardCoinType: string) {
    return queryRewardConfigByCoinType(
      this.client,
      this.#config.PROTOCOL_CONFIG_ID,
      rewardCoinType
    );
  }

  async queryRewardManager() {
    return queryRewardManager(this.client, this.#config.REWARD_MANAGER_ID);
  }

  async queryRewardInfo(rewardCoinType: string) {
    return queryRewardInfo(
      this.client,
      this.#config.REWARD_MANAGER_ID,
      rewardCoinType
    );
  }

  async queryUserPositionIds() {
    const rewardManager = await queryRewardManager(
      this.client,
      this.#config.REWARD_MANAGER_ID
    );
    if (!rewardManager) {
      return null;
    }
    return queryUserPositionIds(
      this.client,
      rewardManager.userPositionsRecordId,
      this.#address
    );
  }

  async queryUserPositions(positionIds: string[]) {
    const rewardManager = await queryRewardManager(
      this.client,
      this.#config.REWARD_MANAGER_ID
    );
    if (!rewardManager) {
      return null;
    }
    return queryUserPositions(this.client, positionIds);
  }

  /**
   * Returns the total staked amount for a given user by summing all valid positions.
   *
   * @param userPositionRecordId - The global position record object ID
   * @param wallet - User wallet address
   * @returns Total staked amount as a BigInt
   */
  async getUserTotalStaked(userPositionRecordId: string, wallet: string) {
    return getUserTotalStaked(this.client, userPositionRecordId, wallet);
  }
}
