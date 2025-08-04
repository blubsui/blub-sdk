/* eslint-disable @typescript-eslint/no-explicit-any */
// Copyright (c) Blub Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { SuiClient } from "@mysten/sui/client";
import { StakePosition } from "../types";
import { getObjectFields } from "../utils/sui";

export async function queryUserPositionIds(
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
  const positionIds = positionFields.data.map((item) => {
    return item.name.value as string;
  });
  return positionIds;
}

export async function parseUserPosition(
  client: SuiClient,
  fields: any
): Promise<StakePosition> {
  const waitClaimRewardTableId = fields.waiting_claim_reward.fields.id.id;
  const waitClaimRewardFields = await client.getDynamicFields({
    parentId: waitClaimRewardTableId,
  });

  const waitingClaimReward: Map<string, bigint> = new Map();
  for (const item of waitClaimRewardFields.data) {
    const object = await client.getObject({
      id: item.objectId,
      options: { showContent: true },
    });
    const fields = getObjectFields(object);
    if (!fields) {
      throw new Error("fields is null");
    }
    waitingClaimReward.set(
      fields.name.fields.name as string,
      BigInt(fields.value)
    );
  }

  const rewardDebtTableId = fields.reward_debt.fields.id.id;
  const rewardDebtFields = await client.getDynamicFields({
    parentId: rewardDebtTableId,
  });
  const rewardDebt: Map<string, bigint> = new Map();
  for (const item of rewardDebtFields.data) {
    const object = await client.getObject({
      id: item.objectId,
      options: { showContent: true },
    });
    const fields = getObjectFields(object);
    if (!fields) {
      throw new Error("fields is null");
    }
    rewardDebt.set(fields.name.fields.name as string, BigInt(fields.value));
  }

  const position: StakePosition = {
    id: fields.id.id,
    stakedAmount: BigInt(fields.staked_amount),
    rewardDebt,
    waitingClaimReward,
  };

  return position;
}

export async function queryUserPositions(
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
 * Returns the total staked amount for a given user by summing all valid positions.
 * 
 * @param client - SuiClient instance
 * @param userPositionRecordId - The global position record object ID
 * @param wallet - User wallet address
 * @returns Total staked amount as a BigInt
 */
export async function getUserTotalStaked(
  client: SuiClient,
  userPositionRecordId: string,
  wallet: string
): Promise<bigint> {
  const positionIds = await queryUserPositionIds(client, userPositionRecordId, wallet);
  if (!positionIds || positionIds.length === 0) return BigInt(0);

  const userPositions = await queryUserPositions(client, positionIds);
  if (!userPositions || userPositions.length === 0) return BigInt(0);

  return userPositions.reduce((total, position) => {
    return position.stakedAmount > BigInt(0)
      ? total + position.stakedAmount
      : total;
  }, BigInt(0));
}

