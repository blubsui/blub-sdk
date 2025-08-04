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

export async function getUserBlubNftPoints(address: string): Promise<bigint> {
  const [walletBalance, summary] = await Promise.all([
    getBlubBalance(address),
    getStakingSummary(address),
  ]);

  const stakedBalance = summary.totalStaked;
  return (
    walletBalance +
    stakedBalance * BigInt(BLUB_NFT_COLLECTION_WHITELIST_STAKE_BOOST)
  );
}
