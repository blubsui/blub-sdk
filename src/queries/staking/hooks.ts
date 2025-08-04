import useSWR from "swr";
import {
  calculatePendingReward,
  getPositionIds,
  getPositions,
  getUserTotalStaked,
} from "./StakingService";
import { PreCalculatePendingRewardParams } from "../../types";

/**
 * React hook to fetch all staking position IDs for a given user address.
 *
 * @param address - Wallet address to query.
 * @returns { positionIds, isLoading, error }
 */
export function useStakePositionIds(address?: string) {
  const { data, error, isLoading } = useSWR(
    address ? ["stakePositionIds", address] : null,
    () => getPositionIds(address!)
  );

  return {
    positionIds: data,
    isLoading,
    error,
  };
}

/**
 * React hook to fetch detailed staking position data from a list of position IDs.
 *
 * @param positionIds - List of staking position object IDs.
 * @returns { positions, isLoading, error }
 */
export function useStakePositions(positionIds?: string[]) {
  const shouldFetch = positionIds && positionIds.length > 0;

  const { data, error, isLoading } = useSWR(
    shouldFetch ? ["stakePositions", ...positionIds] : null,
    () => getPositions(positionIds!)
  );

  return {
    positions: data,
    isLoading,
    error,
  };
}

/**
 * React hook to fetch the total amount staked by a user.
 *
 * @param address - Wallet address to query.
 * @returns { totalStaked, isLoading, error }
 */
export function useUserTotalStaked(address?: string) {
  const { data, error, isLoading } = useSWR(
    address ? ["userTotalStaked", address] : null,
    () => getUserTotalStaked(address!)
  );

  return {
    totalStaked: data,
    isLoading,
    error,
  };
}
/**
 * React hook to simulate pending reward calculation for a given position.
 *
 * @param address - Wallet address to simulate as sender.
 * @param params - Must contain `position` and `coinType`.
 * @returns { pendingRewards, isLoading, error }
 */
export function usePendingReward(
  address?: string,
  params?: PreCalculatePendingRewardParams
) {
  const enabled = !!address && !!params?.position && !!params?.coinType;

  const { data, error, isLoading } = useSWR(
    enabled
      ? ["pendingReward", address, params.position, params.coinType]
      : null,
    () => calculatePendingReward(address!, params!)
  );

  return {
    pendingRewards: data,
    isLoading,
    error,
  };
}
