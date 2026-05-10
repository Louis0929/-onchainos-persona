import type { TransactionPattern, FundFlow } from "../../types/persona.js";
import type { PortfolioTotalValue, PortfolioBalances, PnLOverview, TokenPnL } from "../../types/onchainos.js";
import type { NormalizedSignal, SignalMap } from "./types.js";
import { determineTier, DEFAULT_TIER_BASES, PortfolioTier } from "./types.js";

const MEME_PATTERN = /doge|pepe|shib|floki|wojak|bonk|meme|trump|fart|ponke|neiro|mog/i;
const BLUECHIP_PATTERN = /btc|eth|weth|wbtc|usdc|usdt|dai|aave|uni|link|crv|mkr|ldo|arb|op|sol/i;

function normalizeByTier(rawValue: number, signalId: string, tier: PortfolioTier): number {
  const bases = DEFAULT_TIER_BASES[signalId];
  if (!bases) return Math.min(1, Math.max(0, rawValue));
  const base = bases[Math.min(tier, bases.length - 1)];
  if (base === 0) return 0;
  return Math.min(1, Math.max(0, rawValue / base));
}

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

function rescale(val: number, oldMin: number, oldMax: number): number {
  return (val - oldMin) / (oldMax - oldMin);
}

function giniCoefficient(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const mean = sorted.reduce((s, v) => s + v, 0) / n;
  if (mean === 0) return 0;
  let sumDiff = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      sumDiff += Math.abs(sorted[i] - sorted[j]);
    }
  }
  return sumDiff / (2 * n * n * mean);
}

export function extractSignals(
  pattern: TransactionPattern,
  flow: FundFlow,
  pnlOverview: PnLOverview,
  tokenPnL: TokenPnL[],
  totalValue: PortfolioTotalValue,
  balances: PortfolioBalances,
): SignalMap {
  const tier = determineTier(totalValue.totalUsd);
  const totalUsd = totalValue.totalUsd || 1;
  const allTokens = (balances?.chains || []).flatMap(c => c?.tokens || []);
  const signals: SignalMap = {};

  // ── A. PnL Signals ──

  // winRate
  const hasWinRateData = pnlOverview.tradeCount >= 3 && pnlOverview.winRate > 0;
  signals.pnl_winRate = {
    id: "pnl_winRate",
    raw: pnlOverview.winRate,
    normalized: pnlOverview.winRate,
    hasRealData: hasWinRateData,
  };

  // profitFactor
  const gains = tokenPnL.filter(t => t.pnlUsd > 0).reduce((s, t) => s + t.pnlUsd, 0);
  const losses = Math.abs(tokenPnL.filter(t => t.pnlUsd < 0).reduce((s, t) => s + t.pnlUsd, 0));
  const profitFactor = losses > 0 ? gains / losses : (gains > 0 ? 10 : 0);
  signals.pnl_profitFactor = {
    id: "pnl_profitFactor",
    raw: profitFactor,
    normalized: clamp(profitFactor, 0, 3) / 3,
    hasRealData: tokenPnL.length > 0,
  };

  // avgReturn
  const avgReturn = tokenPnL.length > 0
    ? tokenPnL.reduce((s, t) => s + t.pnlPercent, 0) / tokenPnL.length
    : 0;
  signals.pnl_avgReturn = {
    id: "pnl_avgReturn",
    raw: avgReturn,
    normalized: rescale(clamp(avgReturn, -100, 100), -100, 100),
    hasRealData: tokenPnL.length > 0,
  };

  // returnConsistency
  const mean = avgReturn;
  const variance = tokenPnL.length > 1
    ? tokenPnL.reduce((s, t) => s + (t.pnlPercent - mean) ** 2, 0) / (tokenPnL.length - 1)
    : 0;
  const stddev = Math.sqrt(variance);
  signals.pnl_returnConsistency = {
    id: "pnl_returnConsistency",
    raw: stddev,
    normalized: clamp(1 - stddev / 100, 0, 1),
    hasRealData: tokenPnL.length > 2,
  };

  // memePnlRatio
  const memePnl = tokenPnL.filter(t => MEME_PATTERN.test(t.symbol)).reduce((s, t) => s + t.pnlUsd, 0);
  const totalPnl = tokenPnL.reduce((s, t) => s + Math.abs(t.pnlUsd), 0) || 1;
  signals.pnl_memePnlRatio = {
    id: "pnl_memePnlRatio",
    raw: memePnl / totalPnl,
    normalized: rescale(clamp(memePnl / totalPnl, -2, 2), -2, 2),
    hasRealData: tokenPnL.length > 0,
  };

  // blueChipPnlRatio
  const blueChipPnl = tokenPnL.filter(t => BLUECHIP_PATTERN.test(t.symbol)).reduce((s, t) => s + t.pnlUsd, 0);
  signals.pnl_blueChipPnlRatio = {
    id: "pnl_blueChipPnlRatio",
    raw: blueChipPnl / totalPnl,
    normalized: rescale(clamp(blueChipPnl / totalPnl, -2, 2), -2, 2),
    hasRealData: tokenPnL.length > 0,
  };

  // bigWinRate / bigLossRate
  const bigWins = tokenPnL.filter(t => t.pnlPercent > 50).length;
  const bigLosses = tokenPnL.filter(t => t.pnlPercent < -50).length;
  const tokenCount = Math.max(tokenPnL.length, 1);
  signals.pnl_bigWinRate = {
    id: "pnl_bigWinRate",
    raw: bigWins / tokenCount,
    normalized: bigWins / tokenCount,
    hasRealData: tokenPnL.length > 0,
  };
  signals.pnl_bigLossRate = {
    id: "pnl_bigLossRate",
    raw: bigLosses / tokenCount,
    normalized: bigLosses / tokenCount,
    hasRealData: tokenPnL.length > 0,
  };

  // concentration (top-3 PnL / total)
  const sortedPnl = [...tokenPnL].sort((a, b) => b.pnlUsd - a.pnlUsd);
  const top3Pnl = sortedPnl.slice(0, 3).reduce((s, t) => s + Math.abs(t.pnlUsd), 0);
  const totalAbsPnl = tokenPnL.reduce((s, t) => s + Math.abs(t.pnlUsd), 0) || 1;
  signals.pnl_concentration = {
    id: "pnl_concentration",
    raw: top3Pnl / totalAbsPnl,
    normalized: clamp(top3Pnl / totalAbsPnl, 0, 1),
    hasRealData: tokenPnL.length >= 3,
  };

  // rugCount / highLossCount
  const tierMinBuy = [0, 10, 20, 50, 100, 500][tier];
  const rugCount = tokenPnL.filter(t => t.pnlPercent < -80 && t.buyUsd > tierMinBuy).length;
  const highLossCount = tokenPnL.filter(t => t.pnlPercent < -50 && t.buyUsd > tierMinBuy).length;
  signals.pnl_rugCount = {
    id: "pnl_rugCount",
    raw: rugCount,
    normalized: normalizeByTier(rugCount, "pnl_rugCount", tier),
    hasRealData: tokenPnL.length > 0,
  };
  signals.pnl_highLossCount = {
    id: "pnl_highLossCount",
    raw: highLossCount,
    normalized: normalizeByTier(highLossCount, "pnl_highLossCount", tier),
    hasRealData: tokenPnL.length > 0,
  };

  // memeRatio
  const memeTokens = tokenPnL.filter(t => MEME_PATTERN.test(t.symbol));
  signals.pnl_memeRatio = {
    id: "pnl_memeRatio",
    raw: memeTokens.length / tokenCount,
    normalized: memeTokens.length / tokenCount,
    hasRealData: tokenPnL.length > 0,
  };

  // stableRatio
  const stableUsd = allTokens.reduce((s, t) => /usdc|usdt|dai|busd/i.test(t.symbol) ? s + t.valueUsd : s, 0);
  signals.pnl_stableRatio = {
    id: "pnl_stableRatio",
    raw: stableUsd / totalUsd,
    normalized: clamp(stableUsd / totalUsd, 0, 1),
    hasRealData: allTokens.length > 0,
  };

  // totalPnlRatio
  signals.pnl_totalPnlRatio = {
    id: "pnl_totalPnlRatio",
    raw: pnlOverview.totalPnlUsd / totalUsd,
    normalized: rescale(clamp(pnlOverview.totalPnlUsd / totalUsd, -1, 1), -1, 1),
    hasRealData: pnlOverview.tradeCount > 0,
  };

  // bestTradeImpact / worstTradeImpact
  signals.pnl_bestTradeImpact = {
    id: "pnl_bestTradeImpact",
    raw: pnlOverview.bestTrade.pnlUsd / totalUsd,
    normalized: clamp((pnlOverview.bestTrade.pnlUsd / totalUsd) * 2, 0, 1),
    hasRealData: pnlOverview.bestTrade.pnlUsd !== 0,
  };
  signals.pnl_worstTradeImpact = {
    id: "pnl_worstTradeImpact",
    raw: Math.abs(pnlOverview.worstTrade.pnlUsd) / totalUsd,
    normalized: clamp((Math.abs(pnlOverview.worstTrade.pnlUsd) / totalUsd) * 2, 0, 1),
    hasRealData: pnlOverview.worstTrade.pnlUsd !== 0,
  };

  // ── B. Tx Pattern Signals ──

  const days = 365;
  signals.tx_tradeFrequency = {
    id: "tx_tradeFrequency",
    raw: pattern.totalTrades / days,
    normalized: normalizeByTier(pattern.totalTrades / days, "tx_tradeFrequency", tier),
    hasRealData: true,
  };
  signals.tx_totalTradeCount = {
    id: "tx_totalTradeCount",
    raw: pattern.totalTrades,
    normalized: normalizeByTier(pattern.totalTrades, "tx_totalTradeCount", tier),
    hasRealData: true,
  };
  signals.tx_avgHoldingTimeNorm = {
    id: "tx_avgHoldingTimeNorm",
    raw: pattern.avgHoldingTimeHours,
    normalized: clamp(1 - Math.log(pattern.avgHoldingTimeHours + 1) / Math.log(8760), 0, 1),
    hasRealData: pattern.avgHoldingTimeHours > 0,
  };
  signals.tx_medianTradeSizeRatio = {
    id: "tx_medianTradeSizeRatio",
    raw: pattern.medianTradeSize / totalUsd,
    normalized: clamp(pattern.medianTradeSize / totalUsd, 0, 1),
    hasRealData: pattern.totalTrades > 0,
  };

  const nightHours = [0,1,2,3,4,5,22,23];
  const nightVolume = nightHours.reduce((s, h) => s + (pattern.hourlyDistribution[h] || 0), 0);
  const totalVolume = pattern.hourlyDistribution.reduce((s, v) => s + v, 0) || 1;
  signals.tx_nightActivityRatio = {
    id: "tx_nightActivityRatio",
    raw: nightVolume / totalVolume,
    normalized: nightVolume / totalVolume,
    hasRealData: pattern.totalTrades > 0,
  };
  signals.tx_weekendRatio = {
    id: "tx_weekendRatio",
    raw: pattern.weekendRatio,
    normalized: pattern.weekendRatio,
    hasRealData: pattern.totalTrades > 0,
  };

  const tradeSizes = Array.from({ length: pattern.totalTrades }, (_, i) => i * pattern.medianTradeSize);
  signals.tx_sizeConcentration = {
    id: "tx_sizeConcentration",
    raw: giniCoefficient(tradeSizes),
    normalized: giniCoefficient(tradeSizes),
    hasRealData: pattern.totalTrades > 1,
  };

  // ── C. Fund Flow Signals ──

  signals.flow_exchangeCount = {
    id: "flow_exchangeCount",
    raw: flow.exchangeFlow.length,
    normalized: Math.min(flow.exchangeFlow.length / 3, 1),
    hasRealData: true,
  };
  signals.flow_defiCount = {
    id: "flow_defiCount",
    raw: flow.defiInteractions.length,
    normalized: Math.min(flow.defiInteractions.length / 5, 1),
    hasRealData: true,
  };
  signals.flow_bridgeCount = {
    id: "flow_bridgeCount",
    raw: flow.bridgeActivity.length,
    normalized: Math.min(flow.bridgeActivity.length / 3, 1),
    hasRealData: true,
  };
  signals.flow_isLaundererSuspect = {
    id: "flow_isLaundererSuspect",
    raw: flow.flowType === "launderer_suspect" ? 1 : 0,
    normalized: flow.flowType === "launderer_suspect" ? 1 : 0,
    hasRealData: true,
  };

  // ── D. Cross-Chain Signals ──

  const chainEntries = Object.entries(totalValue.chains || {});
  const activeChains = chainEntries.filter(([, v]) => v > 0).length;
  const maxChainValue = Math.max(...chainEntries.map(([, v]) => v), 0);

  signals.chain_activeChainCount = {
    id: "chain_activeChainCount",
    raw: activeChains,
    normalized: Math.min(activeChains / 5, 1),
    hasRealData: true,
  };
  signals.chain_concentration = {
    id: "chain_concentration",
    raw: maxChainValue / totalUsd,
    normalized: clamp(maxChainValue / totalUsd, 0, 1),
    hasRealData: chainEntries.length > 0,
  };

  const bridgeTrades = flow.bridgeActivity.reduce((s, b) => s + b.count, 0);
  signals.chain_bridgeHopScore = {
    id: "chain_bridgeHopScore",
    raw: bridgeTrades / Math.max(pattern.totalTrades, 1),
    normalized: clamp(bridgeTrades / Math.max(pattern.totalTrades, 1), 0, 1),
    hasRealData: pattern.totalTrades > 0,
  };

  // Multi-chain trade ratio (placeholder: derived from chain diversity)
  signals.chain_multiChainTradeRatio = {
    id: "chain_multiChainTradeRatio",
    raw: activeChains > 1 ? (1 - maxChainValue / totalUsd) : 0,
    normalized: activeChains > 1 ? clamp(1 - maxChainValue / totalUsd, 0, 1) : 0,
    hasRealData: chainEntries.length > 1,
  };

  return signals;
}
