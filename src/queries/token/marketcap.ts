import { getBlubPrice } from "./prices";
import { getBlubCirculatingSupply } from "./stats";

/**
 * Returns the current market capitalization of BLUB in USD.
 *
 * Market cap = circulating supply × current price.
 */
export async function getBlubMarketCap(): Promise<number> {
  const price = await getBlubPrice(); // USD per BLUB
  const circulatingSupply = getBlubCirculatingSupply(); // bigint

  // Convert bigint to number for calculation
  const marketCap = Number(circulatingSupply) * price;

  if (!isFinite(marketCap) || marketCap <= 0) {
    throw new Error("❌ Failed to calculate BLUB market cap.");
  }

  return marketCap;
}
