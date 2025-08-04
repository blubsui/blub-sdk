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
 * Busca todos os position IDs registrados para o usuário.
 */
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
  return positionFields.data.map((item) => item.name.value as string);
}

/**
 * Busca e parseia todas as posições detalhadas de stake.
 */
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
 * Parser de uma posição individual.
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
 * Soma o valor total staked de todas as posições do usuário.
 */
export async function _getUserTotalStaked(
  client: SuiClient,
  userPositionRecordId: string,
  wallet: string
): Promise<bigint> {
  const positionIds = await queryUserPositionIds(
    client,
    userPositionRecordId,
    wallet
  );
  if (!positionIds || positionIds.length === 0) return 0n;

  const positions = await queryUserPositions(client, positionIds);
  if (!positions || positions.length === 0) return 0n;

  return positions.reduce(
    (total, p) => (p.stakedAmount > 0n ? total + p.stakedAmount : total),
    0n
  );
}

/**
 * Simula os eventos de reward para uma posição sem executar transação real.
 */
export async function calculatePendingRewardInternal(
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
