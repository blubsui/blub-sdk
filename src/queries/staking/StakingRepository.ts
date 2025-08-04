// src/queries/stakingRepository.ts

import type { SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { getObjectFields } from "../../utils/sui";
import { StakingBuilder } from "../../builder/StakingBuilder";
import type {
  StakePosition,
  PendingReward,
  PreCalculatePendingRewardParams,
} from "../../types";

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
  client: SuiClient,
  positionIds: string[]
): Promise<StakePosition[]> {
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
  if (!positionIds || positionIds.length === 0) return 0n;

  const positions = await _getPositions(client, positionIds);
  if (!positions || positions.length === 0) return 0n;

  return positions.reduce(
    (total, p) => (p.stakedAmount > 0n ? total + p.stakedAmount : total),
    0n
  );
}

/**
 * Simulates a reward calculation for a position using `devInspectTransactionBlock`,
 * without executing a real on-chain transaction.
 */
export async function _calculatePendingReward(
  client: SuiClient,
  owner: string,
  params: PreCalculatePendingRewardParams,
  packageId: string
): Promise<PendingReward[]> {
  const builder = new StakingBuilder();
  const txb = builder.calculatePendingReward(params, new Transaction());

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

export async function _queryRewardManager(
  client: SuiClient,
  rewardManagerId: string
) {
  const obj = await client.getObject({
    id: rewardManagerId,
    options: { showContent: true },
  });
  const fields = getObjectFields(obj);
  if (!fields) throw new Error("reward‑manager fields is null");

  // Assume on‑chain layout has `reward_coins: vector<..>`
  const rewardCoins: string[] = fields.reward_coins.map((r: any) => r.name);
  return {
    totalStakedAmount: BigInt(fields.total_staked_amount),
    rewardCoins,
  };
}
