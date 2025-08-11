import { BLUB_DECIMALS } from "../../utils/constants";
import { getStakingSummary } from "../staking/StakingService";
import { getBlubBalance } from "../token/client";

export const BLUB_NFT_COLLECTION_WHITELIST_STAKE_BOOST = 1.6;

export interface UserBlubNftPointsResult {
  balance: number;
  staked: number;
  stakeBoost: number;
  points: number;
}

export async function getUserBlubNftPoints(
  address: string
): Promise<UserBlubNftPointsResult> {
  const [walletBalanceRaw, summary] = await Promise.all([
    getBlubBalance(address),
    safeGetStakingSummary(address),
  ]);

  const stakedRaw = summary.totalStaked;
  const balance = Number(walletBalanceRaw) / 10 ** BLUB_DECIMALS;
  const staked = Number(stakedRaw) / 10 ** BLUB_DECIMALS;

  const points = balance + staked * BLUB_NFT_COLLECTION_WHITELIST_STAKE_BOOST;

  return {
    balance,
    staked,
    stakeBoost: BLUB_NFT_COLLECTION_WHITELIST_STAKE_BOOST,
    points,
  };
}

async function safeGetStakingSummary(
  address: string
): Promise<{ totalStaked: bigint }> {
  try {
    return await getStakingSummary(address);
  } catch (err) {
    console.warn(
      `[getUserBlubNftPoints] No staking found for ${address}, defaulting to 0.`
    );
    return { totalStaked: 0n };
  }
}
