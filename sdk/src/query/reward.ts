/* eslint-disable @typescript-eslint/no-explicit-any */
import { SuiClient } from "@mysten/sui/client";
import { RewardInfo, RewardManager } from "../types";
import { completionCoin, getObjectFields } from "../utils/sui";

export async function queryRewardManager(
  client: SuiClient,
  rewardManagerId: string
): Promise<RewardManager | null> {
  const resq = await client.getObject({
    id: rewardManagerId,
    options: { showContent: true },
  });
  const fields = getObjectFields(resq);
  if (!fields) {
    throw new Error("fields is null");
  }

  const rewardsInfos = new Map<string, RewardInfo>();
  fields.rewards_infos.fields.contents.forEach((item: any) => {
    const rewardCoinType = completionCoin(item.fields.key.fields.name);
    const rewardInfo = parseRewardInfo(item.fields.value.fields);
    rewardsInfos.set(rewardCoinType, rewardInfo);
  });

  const rewardManager: RewardManager = {
    id: rewardManagerId,
    totalStakedAmount: BigInt(fields.total_staked_amount),
    rewardsInfos,
    userPositionsRecordId: fields.user_positions_record.fields.id.id,
  };
  return rewardManager;
}

function parseRewardInfo(fields: any): RewardInfo {
  const rewardInfo: RewardInfo = {
    rewardCoinType: completionCoin(fields.reward_coin_type.fields.name),
    accRewardPerShare: BigInt(fields.acc_reward_per_share),
    lastRewardTime: BigInt(fields.last_reward_time),
  };
  return rewardInfo;
}

export async function queryRewardInfo(
  client: SuiClient,
  rewardManagerId: string,
  rewardCoinType: string
): Promise<RewardInfo | null> {
  const rewardManager = await queryRewardManager(client, rewardManagerId);
  if (!rewardManager) {
    return null;
  }
  return rewardManager.rewardsInfos.get(completionCoin(rewardCoinType)) ?? null;
}
