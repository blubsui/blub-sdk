// ─────────────────────────────────────────────────────────────
// Staking builder (low-level transaction builder)
// ─────────────────────────────────────────────────────────────
export { StakingBuilder } from "./builder/StakingBuilder";

// ─────────────────────────────────────────────────────────────
// Staking service (high-level read/query helpers)
// ─────────────────────────────────────────────────────────────
export * as StakingService from "./queries/staking/StakingService";

// ─────────────────────────────────────────────────────────────
// Token queries (preço, supply, market cap, balance, etc.)
// ─────────────────────────────────────────────────────────────
export * from "./queries/token";

// ─────────────────────────────────────────────────────────────
/** Hooks (se quiser expor para front-end React) */
export * from "./hooks";
