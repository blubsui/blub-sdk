/**
 * Returns the current circulating supply of the BLUB token based on a fixed release schedule.
 *
 * - 75% of the total supply was released immediately at launch.
 * - The remaining 25% is released linearly over 3 years (1095 days), starting from June 26, 2024.
 *
 * @returns The current estimated circulating supply as a bigint.
 */
export function getBlubCirculatingSupply(): bigint {
  const now = new Date();

  const TOTAL_SUPPLY = getBlubTotalSupply();
  const RELEASE_START_DATE = new Date(2024, 5, 26); // June 26, 2024 (zero-based month: 5 = June)
  const RELEASE_DURATION_DAYS = 1095n;
  const INITIAL_RELEASE_SUPPLY = (TOTAL_SUPPLY * 75n) / 100n;
  const CURVE_RELEASE_SUPPLY = TOTAL_SUPPLY - INITIAL_RELEASE_SUPPLY;

  const MILLISECONDS_PER_DAY = 86_400_000;

  const elapsedMs = BigInt(now.getTime() - RELEASE_START_DATE.getTime());
  const elapsedDays = elapsedMs / BigInt(MILLISECONDS_PER_DAY);

  if (elapsedDays < 0n) return INITIAL_RELEASE_SUPPLY;
  if (elapsedDays >= RELEASE_DURATION_DAYS) return TOTAL_SUPPLY;

  const curveReleased =
    (CURVE_RELEASE_SUPPLY * elapsedDays) / RELEASE_DURATION_DAYS;

  return INITIAL_RELEASE_SUPPLY + curveReleased;
}

/**
 * Returns the total fixed supply of the BLUB token.
 *
 * @returns The total BLUB supply as a bigint.
 */
export function getBlubTotalSupply(): bigint {
  return 420_690_000_000_000n;
}
