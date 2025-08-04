/* eslint-disable @typescript-eslint/no-explicit-any */
import { SuiClient } from "@mysten/sui/client";
import { ProtocolConfig, RewardConfig } from "../types";
import { completionCoin, getObjectFields } from "../utils/sui";

function parseRewardConfig(fields: any): RewardConfig {
  const rewardConfig: RewardConfig = {
    id: fields.id.id,
    startTime: BigInt(fields.start_time),
    endTime: BigInt(fields.end_time),
    emissionRate: BigInt(fields.emission_rate),
    coinType: completionCoin(fields.coin_type.fields.name),
  };
  return rewardConfig;
}

export async function queryProtocolConfig(
  client: SuiClient,
  protocolConfigId: string
): Promise<ProtocolConfig> {
  const resq = await client.getObject({
    id: protocolConfigId,
    options: { showContent: true },
  });
  // console.log("resq: ", resq);
  const fields = getObjectFields(resq);
  if (!fields) {
    throw new Error("fields is null");
  }

  const rewardConfigs = new Map<string, RewardConfig>();
  fields.reward_configs.fields.contents.forEach((item: any) => {
    const coinType = item.fields.key.fields.name;
    const rewardConfig = parseRewardConfig(item.fields.value.fields);
    rewardConfigs.set(completionCoin(coinType), rewardConfig);
  });

  const protocolConfig: ProtocolConfig = {
    id: protocolConfigId,
    version: fields.version,
    openStaking: fields.open_staking,
    rewardConfigs,
  };
  return protocolConfig;
}

export async function queryRewardConfigByCoinType(
  client: SuiClient,
  protocolConfigId: string,
  rewardCoinType: string
): Promise<RewardConfig | null> {
  const coinType = completionCoin(rewardCoinType);
  const rewardConfigs = await queryProtocolConfig(client, protocolConfigId);
  if (!rewardConfigs) {
    return null;
  }
  const rewardConfig = rewardConfigs.rewardConfigs.get(coinType);
  return rewardConfig ?? null;
}
