import useSWR from "swr";
import { getUserBlubNftPoints } from "./points";

/**
 * React hook to fetch and cache the user's BLUB NFT points.
 *
 * Internally fetches wallet and staked balances and applies a 1.6x multiplier to staked tokens.
 *
 * @param address - The wallet address of the user.
 * @returns { points, isLoading, error }
 */
export function useUserBlubNftPoints(address?: string) {
  const shouldFetch = !!address;

  const { data, error, isLoading } = useSWR(
    shouldFetch ? ["userBlubNftPoints", address] : null,
    () => getUserBlubNftPoints(address!)
  );

  return {
    points: data,
    isLoading,
    error,
  };
}
