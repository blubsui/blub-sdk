import useSWR from "swr";
import { getBlubBalance } from "./client";
import { getBlubCirculatingSupply, getBlubTotalSupply } from "./stats";

/**
 * Hook to fetch the BLUB token balance for a given wallet address.
 *
 * @param address - Wallet address to query.
 * @returns { balance, isLoading, error }
 */
export function useBlubBalance(address?: string) {
  const shouldFetch = !!address;

  const { data, error, isLoading } = useSWR(
    shouldFetch ? ["blubBalance", address] : null,
    () => getBlubBalance(address!)
  );

  return {
    balance: data,
    isLoading,
    error,
  };
}

/**
 * Hook to retrieve the current estimated circulating supply of BLUB.
 *
 * @returns { supply, isLoading, error }
 */
export function useBlubCirculatingSupply() {
  const { data, error } = useSWR(
    "blubCirculatingSupply",
    () => getBlubCirculatingSupply(),
    { refreshInterval: 60_000 }
  );

  return {
    supply: data,
    error,
  };
}

/**
 * Hook to retrieve the fixed total supply of BLUB.
 *
 * @returns { totalSupply }
 */
export function useBlubTotalSupply() {
  const { data, error } = useSWR("blubTotalSupply", () => getBlubTotalSupply());

  return {
    totalSupply: data,
    error,
  };
}
