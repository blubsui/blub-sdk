/* eslint-disable @typescript-eslint/no-explicit-any */
// src/queries/stakingRepository.ts
import { Transaction } from "@mysten/sui/transactions";

import { StakingBuilder } from "../../builder/StakingBuilder";
import type {
  StakePosition,
  PendingReward,
  PreCalculatePendingRewardParams,
  RewardInfo,
  RewardManager,
} from "../../types";
import { completionCoin, getObjectFields } from "../../utils/sui";
import { SuiClient } from "@mysten/sui/client";
import { defaultSuiClient } from "../../utils/client";

/**
 * Fetches all stake position IDs registered for the given user.
 */
export async function _queryUserPositionIds(
  client: SuiClient,
  userPositionRecordId: string,
  wallet: string
): Promise<string[]> {
  const resq = await client.getDynamicFieldObject({
    parentId: userPositionRecordId,
    name: {
      type: "address",
      value: wallet,
    },
  });

  const fields = getObjectFields(resq);
  if (!fields) {
    throw new Error("fields is null");
  }

  const tableId = fields.value.fields.id.id;
  const positionFields = await client.getDynamicFields({ parentId: tableId });
  return positionFields.data.map((item) => item.name.value as string);
}

/**
 * Fetches and parses all stake positions for the given IDs.
 */
export async function _getPositions(
  positionIds: string[],
  client: SuiClient = defaultSuiClient
): Promise<StakePosition[]> {
  //

  const resq = await client.multiGetObjects({
    ids: positionIds,
    options: { showContent: true },
  });

  const positions: StakePosition[] = [];

  for (const item of resq) {
    const fields = getObjectFields(item);
    if (!fields) {
      throw new Error("fields is null");
    }
    const position = await parseUserPosition(client, fields);

    positions.push(position);
  }

  return positions;
}

/**
 * Parses a single stake position object into a StakePosition structure.
 */
export async function parseUserPosition(
  client: SuiClient,
  fields: any
): Promise<StakePosition> {
  const waitingClaim: Map<string, bigint> = new Map();
  const rewardDebt: Map<string, bigint> = new Map();

  const waitClaimRewardTableId = fields.waiting_claim_reward.fields.id.id;
  const waitClaimRewardFields = await client.getDynamicFields({
    parentId: waitClaimRewardTableId,
  });

  for (const item of waitClaimRewardFields.data) {
    const object = await client.getObject({
      id: item.objectId,
      options: { showContent: true },
    });
    const f = getObjectFields(object);
    if (!f) throw new Error("fields is null");
    waitingClaim.set(f.name.fields.name as string, BigInt(f.value));
  }

  const rewardDebtTableId = fields.reward_debt.fields.id.id;
  const rewardDebtFields = await client.getDynamicFields({
    parentId: rewardDebtTableId,
  });

  for (const item of rewardDebtFields.data) {
    const object = await client.getObject({
      id: item.objectId,
      options: { showContent: true },
    });
    const f = getObjectFields(object);
    if (!f) throw new Error("fields is null");
    rewardDebt.set(f.name.fields.name as string, BigInt(f.value));
  }

  return {
    id: fields.id.id,
    stakedAmount: BigInt(fields.staked_amount),
    rewardDebt,
    waitingClaimReward: waitingClaim,
  };
}

/**
 * Calculates the total staked amount across all user positions.
 */
export async function _getUserTotalStaked(
  client: SuiClient,
  userPositionRecordId: string,
  wallet: string
): Promise<bigint> {
  const positionIds = await _queryUserPositionIds(
    client,
    userPositionRecordId,
    wallet
  );

  if (!positionIds || positionIds.length === 0) return BigInt(0);

  const positions = await _getPositions(positionIds);
  if (!positions || positions.length === 0) return BigInt(0);

  return positions.reduce(
    (total, p) => (p.stakedAmount > BigInt(0) ? total + p.stakedAmount : total),
    BigInt(0)
  );
}

/**
 * Simulates a reward calculation for a position using `devInspectTransactionBlock`,
 * without executing a real on-chain transaction.
 */
export async function _calculatePendingReward(
  owner: string,
  { position, coinType }: PreCalculatePendingRewardParams,
  packageId: string,
  client: SuiClient = defaultSuiClient
): Promise<PendingReward[]> {
  const builder = new StakingBuilder();

  const txb = builder.calculatePendingReward(
    { position, coinType },
    new Transaction()
  );

  const inspection = await client.devInspectTransactionBlock({
    transactionBlock: txb,
    sender: owner,
  });

  const events = inspection.events ?? [];
  const pending: PendingReward[] = [];

  for (const e of events) {
    if (e.type === `${packageId}::events::CalculatePendingRewardEvent`) {
      const dat = (e.parsedJson as any).reward_info;
      pending.push({
        coinType: dat.coin_type.name,
        pendingReward: BigInt(dat.pending_reward_amount),
      });
    }
  }

  return pending;
}

export async function queryRewardManager(
  client: SuiClient,
  rewardManagerId: string
): Promise<RewardManager | null> {
  const resq = await client.getObject({
    id: rewardManagerId,
    options: { showContent: true },
  });
  const fields = getObjectFields(resq);
  if (!fields) throw new Error("fields is null");

  const rewardsInfos = new Map<string, RewardInfo>();
  const contents = fields.rewards_infos?.fields?.contents ?? [];
  contents.forEach((item: any) => {
    const rewardCoinType = completionCoin(item.fields.key.fields.name);
    const rewardInfo = parseRewardInfo(item.fields.value.fields);
    rewardsInfos.set(rewardCoinType, rewardInfo);
  });

  return {
    id: rewardManagerId,
    totalStakedAmount: BigInt(fields.total_staked_amount),
    rewardsInfos,
    userPositionsRecordId: fields.user_positions_record.fields.id.id,
  };
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
