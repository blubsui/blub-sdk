// src/utils/config.ts

import type { Environment } from "../types";
import { mainnetObjectIds, testnetObjectIds } from "./constants";

export const GAS_BUDGET = 0.5 * 500_000_000;

export class StakingConfig {
  readonly BLUB_STAKING_PACKAGE_ID: string;
  readonly ADMIN_CAP_ID: string;
  readonly PROTOCOL_CONFIG_ID: string;
  readonly REWARD_MANAGER_ID: string;
  readonly VAULT_ID: string;

  constructor(env: Environment) {
    const ids = env === "mainnet" ? mainnetObjectIds : testnetObjectIds;

    this.BLUB_STAKING_PACKAGE_ID = ids.BLUB_STAKING_PACKAGE_ID;
    this.ADMIN_CAP_ID = ids.ADMIN_CAP_ID;
    this.PROTOCOL_CONFIG_ID = ids.PROTOCOL_CONFIG_ID;
    this.REWARD_MANAGER_ID = ids.REWARD_MANAGER_ID;
    this.VAULT_ID = ids.VAULT_ID;
  }
}

export const getStakingObjectIds = (env: Environment = "mainnet") => {
  return env === "mainnet" ? mainnetObjectIds : testnetObjectIds;
};
