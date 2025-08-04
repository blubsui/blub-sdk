// src/utils/client.ts
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";

export const defaultSuiClient = new SuiClient({
  url: getFullnodeUrl("mainnet"),
});
