// Copyright (c) Blub Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import type { Transaction } from "@mysten/sui/transactions";
import type { StakingConfig } from "../utils/config.js";
import { SuiClient } from "@mysten/sui/client";
import {
  StartStakingParams,
  StopStakingParams,
  UpdatePackageVersionParams,
} from "../types/params";

/**
 * BalanceManagerContract class for managing BalanceManager operations.
 */
export class ConfigModule {
  #config: StakingConfig;
  #client: SuiClient;

  /**
   * @param {StakingConfig} config Configuration for BlubStakingConfig
   */
  constructor(config: StakingConfig, client: SuiClient) {
    this.#config = config;
    this.#client = client;
  }

  /**
   * @description Start staking
   * @param {StartStakingParams} params Parameters for starting staking
   * @param {Transaction} tx Transaction object
   */
  startStakingMoveCall(params: StartStakingParams, tx: Transaction) {
    const adminCap = params.adminCap ?? this.#config.ADMIN_CAP_ID;
    const protocolConfig =
      params.protocolConfig ?? this.#config.PROTOCOL_CONFIG_ID;

    tx.moveCall({
      target: `${this.#config.BLUB_STAKING_PACKAGE_ID}::config::start_staking`,
      arguments: [tx.object(adminCap), tx.object(protocolConfig)],
    });
  }

  /**
   * @description Stop staking
   * @param {StopStakingParams} params Parameters for stopping staking
   * @param {Transaction} tx Transaction object
   */
  stopStakingMoveCall(params: StopStakingParams, tx: Transaction) {
    const adminCap = params.adminCap ?? this.#config.ADMIN_CAP_ID;
    const protocolConfig =
      params.protocolConfig ?? this.#config.PROTOCOL_CONFIG_ID;

    tx.moveCall({
      target: `${this.#config.BLUB_STAKING_PACKAGE_ID}::config::stop_staking`,
      arguments: [tx.object(adminCap), tx.object(protocolConfig)],
    });
  }

  /**
   * @description Update package version
   * @param {UpdatePackageVersionParams} params Parameters for updating package version
   * @param {Transaction} tx Transaction object
   */
  updatePackageVersionMoveCall(
    params: UpdatePackageVersionParams,
    tx: Transaction
  ) {
    const adminCap = params.adminCap ?? this.#config.ADMIN_CAP_ID;
    const protocolConfig =
      params.protocolConfig ?? this.#config.PROTOCOL_CONFIG_ID;

    tx.moveCall({
      target: `${this.#config.BLUB_STAKING_PACKAGE_ID}::config::update_package_version`,
      arguments: [
        tx.object(adminCap),
        tx.object(protocolConfig),
        tx.pure.u64(params.version),
      ],
    });
  }

  async get_protocol_config(protocolConfigId?: string) {
    const protocolConfig = await this.#client.getObject({
      id: protocolConfigId ?? this.#config.PROTOCOL_CONFIG_ID,
      options: { showContent: true, showType: true },
    });

    return protocolConfig;
  }
}
