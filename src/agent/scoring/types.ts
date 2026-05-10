// ─── Scoring Layer Types ───

export enum PortfolioTier {
  dust = 0,
  shrimp = 1,
  fish = 2,
  dolphin = 3,
  whale = 4,
  mega_whale = 5,
}

export function determineTier(totalUsd: number): PortfolioTier {
  if (totalUsd < 100) return PortfolioTier.dust;
  if (totalUsd < 1_000) return PortfolioTier.shrimp;
  if (totalUsd < 10_000) return PortfolioTier.fish;
  if (totalUsd < 100_000) return PortfolioTier.dolphin;
  if (totalUsd < 1_000_000) return PortfolioTier.whale;
  return PortfolioTier.mega_whale;
}

export interface NormalizedSignal {
  id: string;
  raw: number;
  normalized: number; // 0-1
  hasRealData: boolean;
}

export type SignalMap = Record<string, NormalizedSignal>;

export interface AxisWeightConfig {
  signalId: string;
  weight: number;
  direction: 1 | -1; // 1 = higher signal pushes axis up, -1 = pushes down
}

export interface ScoringConfig {
  energy: AxisWeightConfig[];
  risk: AxisWeightConfig[];
  speed: AxisWeightConfig[];
  social: AxisWeightConfig[];
  tierBases: Record<string, number[]>; // signal -> [tier0_max, tier1_max, ...]
}

export const DEFAULT_TIER_BASES: Record<string, number[]> = {
  tx_tradeFrequency: [0.5, 1, 2, 5, 10, 20],
  tx_totalTradeCount: [10, 30, 80, 200, 500, 1000],
  pnl_rugCount: [1, 1, 2, 3, 5, 10],
  pnl_highLossCount: [2, 3, 5, 10, 15, 25],
};

export const DEFAULT_CONFIG: ScoringConfig = {
  energy: [
    { signalId: "tx_tradeFrequency", weight: 0.15, direction: 1 },
    { signalId: "pnl_memeRatio", weight: 0.12, direction: 1 },
    { signalId: "tx_totalTradeCount", weight: 0.10, direction: 1 },
    { signalId: "chain_activeChainCount", weight: 0.10, direction: 1 },
    { signalId: "pnl_rugCount", weight: 0.08, direction: 1 },
    { signalId: "pnl_stableRatio", weight: 0.08, direction: -1 },
    { signalId: "chain_bridgeHopScore", weight: 0.06, direction: 1 },
    { signalId: "tx_sizeConcentration", weight: 0.06, direction: -1 },
    { signalId: "pnl_memePnlRatio", weight: 0.08, direction: 1 },
    { signalId: "pnl_bigWinRate", weight: 0.05, direction: -1 },
    { signalId: "pnl_concentration", weight: 0.06, direction: 1 },
    { signalId: "flow_bridgeCount", weight: 0.06, direction: 1 },
  ],
  risk: [
    { signalId: "pnl_winRate", weight: 0.14, direction: -1 },
    { signalId: "pnl_profitFactor", weight: 0.12, direction: -1 },
    { signalId: "pnl_rugCount", weight: 0.10, direction: 1 },
    { signalId: "pnl_stableRatio", weight: 0.10, direction: -1 },
    { signalId: "pnl_highLossCount", weight: 0.10, direction: 1 },
    { signalId: "pnl_memeRatio", weight: 0.08, direction: 1 },
    { signalId: "pnl_worstTradeImpact", weight: 0.08, direction: 1 },
    { signalId: "pnl_bigLossRate", weight: 0.08, direction: 1 },
    { signalId: "pnl_returnConsistency", weight: 0.06, direction: -1 },
    { signalId: "pnl_totalPnlRatio", weight: 0.06, direction: -1 },
    { signalId: "pnl_memePnlRatio", weight: 0.05, direction: 1 },
    { signalId: "tx_medianTradeSizeRatio", weight: 0.05, direction: 1 },
    { signalId: "flow_defiCount", weight: 0.04, direction: 1 },
  ],
  speed: [
    { signalId: "tx_avgHoldingTimeNorm", weight: 0.20, direction: 1 },
    { signalId: "tx_tradeFrequency", weight: 0.14, direction: 1 },
    { signalId: "tx_totalTradeCount", weight: 0.10, direction: 1 },
    { signalId: "pnl_returnConsistency", weight: 0.08, direction: -1 },
    { signalId: "pnl_totalPnlRatio", weight: 0.08, direction: -1 },
    { signalId: "tx_medianTradeSizeRatio", weight: 0.06, direction: 1 },
    { signalId: "tx_nightActivityRatio", weight: 0.06, direction: 1 },
    { signalId: "pnl_bestTradeImpact", weight: 0.06, direction: -1 },
    { signalId: "pnl_profitFactor", weight: 0.06, direction: -1 },
    { signalId: "pnl_concentration", weight: 0.06, direction: -1 },
    { signalId: "chain_multiChainTradeRatio", weight: 0.05, direction: 1 },
    { signalId: "tx_sizeConcentration", weight: 0.05, direction: -1 },
  ],
  social: [
    { signalId: "pnl_winRate", weight: 0.12, direction: -1 },
    { signalId: "flow_exchangeCount", weight: 0.12, direction: 1 },
    { signalId: "pnl_memeRatio", weight: 0.10, direction: 1 },
    { signalId: "flow_defiCount", weight: 0.10, direction: 1 },
    { signalId: "pnl_memePnlRatio", weight: 0.08, direction: 1 },
    { signalId: "chain_concentration", weight: 0.08, direction: 1 },
    { signalId: "flow_isLaundererSuspect", weight: 0.08, direction: -1 },
    { signalId: "pnl_profitFactor", weight: 0.06, direction: -1 },
    { signalId: "chain_bridgeHopScore", weight: 0.06, direction: -1 },
    { signalId: "flow_bridgeCount", weight: 0.06, direction: -1 },
    { signalId: "tx_weekendRatio", weight: 0.04, direction: 1 },
    { signalId: "pnl_totalPnlRatio", weight: 0.04, direction: -1 },
    { signalId: "pnl_blueChipPnlRatio", weight: 0.06, direction: -1 },
  ],
  tierBases: DEFAULT_TIER_BASES,
};

export interface AxisConfidences {
  energyConfidence: number;
  riskConfidence: number;
  speedConfidence: number;
  socialConfidence: number;
}
