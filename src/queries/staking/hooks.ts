// src/hooks/useStakingSummary.ts
import useSWR from "swr";
import { getStakingSummary } from "./StakingService";

export function useStakingSummary(address?: string) {
  const { data, error, isLoading } = useSWR(
    address ? ["stakingSummary", address] : null,
    () => getStakingSummary(address!)
  );

  return { summary: data, isLoading, error };
}
