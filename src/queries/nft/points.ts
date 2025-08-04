import { getBlubBalance } from "../token/client";
import { getUserTotalStaked } from "../staking/StakingService";

/**
 * Fetches the user's wallet and staked balances, and calculates total points.
 *
 * Formula:
 *   totalPoints = walletBalance * 1 + stakedBalance * stakeMultiplier
 *
 * @param address - User's wallet address.
 * @returns Total points for the user as a bigint.
 */
export async function getUserBlubNftPoints(address: string): Promise<bigint> {
  const [walletBalance, stakedBalance] = await Promise.all([
    getBlubBalance(address),
    getUserTotalStaked(address),
  ]);

  return walletBalance + stakedBalance * BigInt(1.6);
}
