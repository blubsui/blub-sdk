/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SuiClient } from "@mysten/sui/client";
import { defaultSuiClient } from "../../utils/client";
import { BLUB_COINTYPE } from "../../utils/constants";

/**
 * Retrieves the BLUB token balance for a given wallet address.
 *
 * @param owner - The address to query the BLUB balance for.
 * @returns The total BLUB balance as a bigint.
 */
export function getBlubBalance(owner: string): Promise<bigint> {
  return getCoinBalance(owner, BLUB_COINTYPE);
}

/**
 * Retrieves the balance of any given coin type for a specific wallet address.
 *
 * @param owner - The wallet address to query.
 * @param coinType - The full coin type string (e.g., `0x...::blub::BLUB`).
 * @param client - Optional SuiClient instance (defaults to `defaultSuiClient`).
 * @returns The total balance for the specified coin type as a bigint.
 */
async function getCoinBalance(
  owner: string,
  coinType: string,
  client: SuiClient = defaultSuiClient
): Promise<bigint> {
  if (typeof (client as any).getBalance === "function") {
    const resp = await (client as any).getBalance({ owner, coinType });
    return BigInt(resp.totalBalance ?? 0);
  }

  const coins = await client.getCoins({ owner, coinType });
  return coins.data.reduce((sum, c) => sum + BigInt(c.balance), BigInt(0));
}
