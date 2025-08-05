import useSWR from "swr";
import { getBlubBalance } from "./client";
import { getBlubPrice, getSuiPrice } from "./prices";
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
    () => getBlubBalance(address!),
    { refreshInterval: 30_000 }
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

/**
 * Hook to fetch the current BLUB price in USD.
 */
export function useBlubPrice() {
  const { data, error, isLoading } = useSWR("blubPrice", getBlubPrice);

  return {
    price: data,
    isLoading,
    error,
  };
}

/**
 * Hook to fetch the current SUI price in USD.
 */
export function useSuiPrice() {
  const { data, error, isLoading } = useSWR("suiPrice", getSuiPrice);

  return {
    price: data,
    isLoading,
    error,
  };
}
