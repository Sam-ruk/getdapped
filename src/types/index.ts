export interface DappData {
  name: string;
  info: string;
  web: string;
  x?: string;
}

export interface DappsCollection {
  [category: string]: DappData[];
}

export const CATEGORIES = [
  "Account", "AI", "Analyze", "Apps", "Cross", "DeFi", "DePIN", "Dev", 
  "Gaming", "Govern", "Identity", "Indexer", "Infra", "NFT", "Onramp", 
  "Oracle", "Payment", "Predict", "Privacy", "RWA", "Stable", "Wallet", "zK"
] as const;

export type CategoryType = typeof CATEGORIES[number];