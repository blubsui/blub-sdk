// src/utils/client.ts
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";

/**
 * Instância padrão, para todo mundo que não precisar customizar.
 */
export const defaultSuiClient = new SuiClient({
  url: getFullnodeUrl("mainnet"),
});
