import { getSuiPrice as _getSuiPrice, getTokenPrice } from "@7kprotocol/sdk-ts";
import { BLUB_COINTYPE } from "../../utils/constants";

/**
 * Returns the current BLUB token price in USD.
 */
export async function getBlubPrice(): Promise<number> {
  const price = await getTokenPrice(BLUB_COINTYPE);

  if (!price || isNaN(price) || price <= 0) {
    throw new Error("❌ Failed to fetch valid BLUB price.");
  }

  return price;
}

/**
 * Returns the current SUI token price in USD.
 */
export async function getSuiPrice(): Promise<number> {
  const price = await _getSuiPrice();

  if (!price || isNaN(price) || price <= 0) {
    throw new Error("❌ Failed to fetch valid SUI price.");
  }

  return price;
}
