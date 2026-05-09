export interface PortfolioTotalValue {
  totalUsd: number;
  chains: Record<string, number>;
}

export interface TokenBalance {
  token: string;
  symbol: string;
  amount: number;
  valueUsd: number;
  chain: string;
}

export interface PortfolioBalances {
  address: string;
  chains: {
    chain: string;
    tokens: TokenBalance[];
    totalUsd: number;
  }[];
}

export interface PnLOverview {
  address: string;
  totalPnlUsd: number;
  winRate: number;
  tradeCount: number;
  avgHoldingTime: string;
  bestTrade: { token: string; pnlUsd: number };
  worstTrade: { token: string; pnlUsd: number };
}

export interface TokenPnL {
  token: string;
  symbol: string;
  buyUsd: number;
  sellUsd: number;
  pnlUsd: number;
  pnlPercent: number;
  holdingAmount: number;
  holdingValueUsd: number;
}

export interface DexTrade {
  hash: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
  amountOut: number;
  valueUsd: number;
  timestamp: number;
  chain: string;
}
