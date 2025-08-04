import { getStakingSummary } from "../staking/StakingService";
import { getBlubBalance } from "../token/client";

/**
 * Multiplier applied to staked BLUB tokens when calculating user points
 * for the BLUB NFT collection whitelist campaign.
 *
 * Example:
 *   1 BLUB in wallet  = 1 point
 *   1 BLUB staked     = 1.6 points (boosted)
 */
export const BLUB_NFT_COLLECTION_WHITELIST_STAKE_BOOST = 1.6;
const BLUB_DECIMALS = 2;

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
    getStakingSummary(address),
  ]);

  const stakedRaw = summary.totalStaked;

  const balance = Number(walletBalanceRaw) / 10 ** BLUB_DECIMALS;
  const staked = Number(stakedRaw) / 10 ** BLUB_DECIMALS;

  const points = balance + staked * BLUB_NFT_COLLECTION_WHITELIST_STAKE_BOOST;

  return {
    balance,
    staked,
    stakeBoost: BLUB_NFT_COLLECTION_WHITELIST_STAKE_BOOST,
    points: points / 1_000_000_000,
  };
}
