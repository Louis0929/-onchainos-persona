import * as oc from "../utils/onchainos.js";
import type { PortfolioTotalValue, PortfolioBalances, PnLOverview, TokenPnL, DexTrade } from "../types/onchainos.js";
import type {
  TransactionPattern,
  FundFlow,
  FlowNode,
  PersonalityPortrait,
  OnchainMBTI,
  MBTIAxes,
  TrustScore,
  PersonaReport,
} from "../types/persona.js";
import { MBTI_DESCRIPTIONS, computeMBTI, ARCHETYPE_LABELS } from "../types/persona.js";
import { classifyWithScoring } from "./scoring/classify.js";

const DEFAULT_CHAINS = ["ethereum", "base", "bsc", "arbitrum", "polygon", "optimism", "avalanche"];
const MEME_PATTERN = /doge|pepe|shib|floki|wojak|bonk|meme|trump|fart|ponke|neiro|mog/i;
const DEFI_PATTERN = /aave|compound|uniswap|curve|maker|lido|rocketpool|sushi|1inch|yearn|convex|balancer/i;

// ─── 1. Transaction Pattern Analysis ───

function analyzeTransactionPattern(trades: DexTrade[], pnlOverview: PnLOverview): TransactionPattern {
  const hourlyDist = new Array(24).fill(0);
  let weekendCount = 0;
  let weekdayCount = 0;

  for (const trade of trades) {
    if (trade.timestamp) {
      const date = new Date(trade.timestamp);
      const hour = date.getUTCHours();
      hourlyDist[hour] += trade.valueUsd || 1;
      const day = date.getUTCDay();
      if (day === 0 || day === 6) weekendCount++;
      else weekdayCount++;
    }
  }

  const maxHour = Math.max(...hourlyDist, 1);
  const normalized = hourlyDist.map(v => v / maxHour);

  const nightHours = [0,1,2,3,4,5,22,23];
  const morningHours = [6,7,8,9,10,11];
  const nightActivity = nightHours.reduce((s, h) => s + normalized[h], 0);
  const morningActivity = morningHours.reduce((s, h) => s + normalized[h], 0);
  const allHoursActive = normalized.filter(v => v > 0.3).length;

  let activityRhythm: string;
  if (allHoursActive >= 20) {
    activityRhythm = "machine";
  } else if (nightActivity > morningActivity * 1.5) {
    activityRhythm = "night_owl";
  } else if (morningActivity > nightActivity * 1.5) {
    activityRhythm = "early_bird";
  } else {
    activityRhythm = "balanced";
  }

  const sizes = trades.map(t => t.valueUsd || 0).filter(v => v > 0);
  sizes.sort((a, b) => a - b);
  const medianTradeSize = sizes.length > 0 ? sizes[Math.floor(sizes.length / 2)] : 0;

  const sizeDistribution = { small: 0, medium: 0, large: 0, whale: 0 };
  for (const s of sizes) {
    if (s < 100) sizeDistribution.small++;
    else if (s < 10_000) sizeDistribution.medium++;
    else if (s < 100_000) sizeDistribution.large++;
    else sizeDistribution.whale++;
  }

  const avgHoldingTimeHours = parseFloat(pnlOverview.avgHoldingTime) || 0;
  const totalDays = weekendCount + weekdayCount;
  const weekendRatio = totalDays > 0 ? weekendCount / totalDays : 0.29;

  return {
    hourlyDistribution: normalized,
    activityRhythm,
    tradeFrequency: trades.length > 0 ? trades.length / Math.max(30, 1) : 0,
    totalTrades: trades.length,
    medianTradeSize,
    sizeDistribution,
    avgHoldingTimeHours,
    weekendRatio,
  };
}

// ─── 2. Fund Flow Analysis ───

const KNOWN_EXCHANGES: Record<string, string> = {
  "0x28c6c06298d514db089934071355e5743bf21d60": "Binance",
  "0x21a31ee1afc51d94c2efccaa2092ad1028285549": "Binance",
  "0x56eddb7aa87536c09ccc2793473599fd21a8b17f": "Binance 2",
  "0xdfd5293d8e347dfe59e90efd55b2956a1343963d": "Binance 3",
  "0xbe0eb53f46cd790cd13851d5eff43d12404d33e8": "Binance 4",
  "0x3f5ce5fbfe3e9af3979dd8c8da2a5c4740e4b5c9": "Binance 5",
  "0x7a16ff8270133f063aab6c9977683e917d3d4efb": "OKX",
  "0x6cc5f12088f3776d7e2a4a5e52f0c8e7e62f4a30": "OKX 2",
  "0x95222290dd7278aa3ddd389cc1e1d165cc4bafe5": "Uniswap V3",
  "0x68b3465833fb72a70ecdf485e0e4c7b818c1ce6a": "Uniswap V3 2",
  "0xe592427a0aece92de3edee1f18e0157c05861564": "Uniswap SwapRouter",
  "0xdef1c0ded9bec7f1a1670819833240f027b25eff": "0x Protocol",
  "0x1111111254eeb25477b68fb85ed929f73a960582": "1inch",
};

const KNOWN_BRIDGES: Record<string, string> = {
  "0x3ee18b2214aff97000d974cf647e7c347e8fa585": "Stargate",
  "0x8731d54e9d02c286767d56ac03e8037c07e01e98": "Stargate V2",
  "0xbf689d4544e8e9e96a8b500a4e4ff9f3f7f0d58b": "Across",
  "0xce16f69375520ab01377ce7b88f5ba34c914487c": "Stargate USDC",
  "0x7612e0af7f7a7e0f4102a7f7711d3a1d968c1a6e": "Hop",
  "0xb4a3a6af0c070e3e8f2e3c6c4e5d6f7a8b9c0d1e": "Synapse",
  "0xa3a1a2a3a4a5a6a7a8a9b0b1b2b3b4b5b6b7b8b9": "Celer",
};

function classifyAddress(address: string): FlowNode["type"] {
  const lower = address.toLowerCase();
  if (KNOWN_EXCHANGES[lower]) return "exchange";
  if (KNOWN_BRIDGES[lower]) return "bridge";
  if (lower.length <= 10) return "contract";
  return "unknown";
}

function analyzeFundFlow(trades: DexTrade[], balances: PortfolioBalances, totalValue: PortfolioTotalValue): FundFlow {
  const sourceMap = new Map<string, FlowNode>();
  const destMap = new Map<string, FlowNode>();
  const defiMap = new Map<string, { protocol: string; action: string; count: number; totalUsd: number }>();
  const bridgeList: FundFlow["bridgeActivity"] = [];
  const exchangeMap = new Map<string, { deposited: number; withdrawn: number }>();

  for (const trade of trades) {
    const tokenInLower = (trade.tokenIn || "").toLowerCase();
    const tokenOutLower = (trade.tokenOut || "").toLowerCase();

    // DeFi protocol detection
    if (DEFI_PATTERN.test(tokenInLower) || DEFI_PATTERN.test(tokenOutLower)) {
      const proto = DEFI_PATTERN.test(tokenInLower) ? tokenInLower : tokenOutLower;
      const existing = defiMap.get(proto) || { protocol: proto, action: "swap", count: 0, totalUsd: 0 };
      existing.count++;
      existing.totalUsd += trade.valueUsd || 0;
      defiMap.set(proto, existing);
    }

    // Exchange detection
    const exLabel = KNOWN_EXCHANGES[tokenInLower] || KNOWN_EXCHANGES[tokenOutLower];
    if (exLabel) {
      const existing = exchangeMap.get(exLabel) || { deposited: 0, withdrawn: 0 };
      existing.deposited += trade.valueUsd || 0;
      exchangeMap.set(exLabel, existing);
    }

    // Bridge detection
    const bridgeLabel = KNOWN_BRIDGES[tokenInLower] || KNOWN_BRIDGES[tokenOutLower];
    if (bridgeLabel) {
      const existing = bridgeList.find(b => b.from === bridgeLabel || b.to === bridgeLabel);
      if (existing) {
        existing.count++;
        existing.totalUsd += trade.valueUsd || 0;
      } else {
        bridgeList.push({
          from: trade.chain || "unknown",
          to: bridgeLabel,
          count: 1,
          totalUsd: trade.valueUsd || 0,
        });
      }
    }
  }

  // Infer bridge activity from cross-chain value presence
  const chainValues = Object.entries(totalValue.chains || {});
  const chainsWithValue = chainValues.filter(([, v]) => v > 100).length;
  if (chainsWithValue >= 2 && bridgeList.length === 0) {
    bridgeList.push({
      from: "inferred",
      to: `${chainsWithValue} chains with value`,
      count: chainsWithValue - 1,
      totalUsd: 0,
    });
  }

  const exchangeFlow: FundFlow["exchangeFlow"] = [];
  for (const [exchange, flow] of exchangeMap) {
    exchangeFlow.push({ exchange, ...flow });
  }

  for (const trade of trades) {
    const inAddr = trade.tokenIn || "";
    const outAddr = trade.tokenOut || "";

    if (inAddr) {
      const existing = sourceMap.get(inAddr) || {
        address: inAddr, label: KNOWN_EXCHANGES[inAddr.toLowerCase()] || KNOWN_BRIDGES[inAddr.toLowerCase()] || inAddr.slice(0, 10),
        type: classifyAddress(inAddr), totalInUsd: 0, totalOutUsd: 0, interactionCount: 0,
      };
      existing.totalInUsd += trade.valueUsd || 0;
      existing.interactionCount++;
      sourceMap.set(inAddr, existing);
    }

    if (outAddr) {
      const existing = destMap.get(outAddr) || {
        address: outAddr, label: KNOWN_EXCHANGES[outAddr.toLowerCase()] || KNOWN_BRIDGES[outAddr.toLowerCase()] || outAddr.slice(0, 10),
        type: classifyAddress(outAddr), totalInUsd: 0, totalOutUsd: 0, interactionCount: 0,
      };
      existing.totalOutUsd += trade.valueUsd || 0;
      existing.interactionCount++;
      destMap.set(outAddr, existing);
    }
  }

  const topSources = [...sourceMap.values()].sort((a, b) => b.totalInUsd - a.totalInUsd).slice(0, 10);
  const topDestinations = [...destMap.values()].sort((a, b) => b.totalOutUsd - a.totalOutUsd).slice(0, 10);
  const defiInteractions = [...defiMap.values()];

  const hasExchange = exchangeFlow.length > 0;
  const hasDefi = defiInteractions.length > 0;
  const hasBridge = bridgeList.length > 0;
  const tradeCount = trades.length;
  const totalUsd = totalValue.totalUsd;

  // Launderer suspicion heuristic
  const uniqueCounterparties = new Set([
    ...trades.map(t => t.tokenIn?.toLowerCase()),
    ...trades.map(t => t.tokenOut?.toLowerCase()),
  ].filter(Boolean)).size;
  const counterpartyRatio = tradeCount > 0 ? uniqueCounterparties / tradeCount : 0;
  const avgTradeValue = trades.reduce((s, t) => s + (t.valueUsd || 0), 0) / Math.max(tradeCount, 1);
  const isFragmented = avgTradeValue < 200 && tradeCount > 20;
  const isPureTransfer = defiInteractions.length === 0 && exchangeFlow.length === 0;

  let flowType: FundFlow["flowType"];
  if (isFragmented && counterpartyRatio > 0.8 && isPureTransfer) flowType = "launderer_suspect";
  else if (hasBridge && bridgeList.length >= 3) flowType = "bridge_hopper";
  else if (hasDefi && defiInteractions.length >= 3) flowType = "farmer";
  else if (hasExchange && tradeCount >= 50) flowType = "trader";
  else if (tradeCount < 5 && totalUsd > 0) flowType = "hodler";
  else if (totalUsd > 0 && tradeCount < 10) flowType = "saver";
  else flowType = "trader";

  return { topSources, topDestinations, defiInteractions, bridgeActivity: bridgeList, exchangeFlow, flowType };
}

// ─── 3. MBTI Personality Classification ───

// ─── 4. Trust Score ───

function calculateTrustScore(
  pattern: TransactionPattern,
  flow: FundFlow,
  personality: PersonalityPortrait,
  pnlOverview: PnLOverview,
  totalValue: PortfolioTotalValue,
): TrustScore {
  const redFlags: string[] = [];
  const greenFlags: string[] = [];

  let authenticity = 50;
  if (pattern.activityRhythm === "machine") { authenticity -= 30; redFlags.push("24小時均勻交易，疑似機器人"); }
  else if (pattern.activityRhythm === "night_owl" || pattern.activityRhythm === "early_bird") { authenticity += 20; greenFlags.push("有明確作息規律，可能是真人"); }
  if (pattern.weekendRatio >= 0.1 && pattern.weekendRatio <= 0.5) { authenticity += 10; greenFlags.push("週末/平日交易比例正常"); }
  else { authenticity -= 10; }
  if (pattern.totalTrades > 500 && pattern.medianTradeSize < 100) { authenticity -= 20; redFlags.push("大量微小交易，疑似刷量或套利機器人"); }
  authenticity = Math.max(0, Math.min(100, authenticity));

  let financialHealth = 50;
  if (pnlOverview.winRate > 0.6) { financialHealth += 20; greenFlags.push(`勝率 ${(pnlOverview.winRate * 100).toFixed(1)}% 健康盈利`); }
  else if (pnlOverview.winRate < 0.3) { financialHealth -= 20; redFlags.push(`勝率僅 ${(pnlOverview.winRate * 100).toFixed(1)}% 虧損嚴重`); }
  if (totalValue.totalUsd > 100_000) financialHealth += 15;
  if (totalValue.totalUsd > 1_000_000) financialHealth += 10;
  if (pnlOverview.totalPnlUsd > 0) { financialHealth += 10; greenFlags.push(`累計盈利 $${Math.round(pnlOverview.totalPnlUsd).toLocaleString()}`); }
  financialHealth = Math.max(0, Math.min(100, financialHealth));

  let reputation = 50;
  const mbti = personality.mbti;
  // Lone types with high win rate get reputation bonus
  if (mbti[3] === "L" && pnlOverview.winRate > 0.55) { reputation += 20; greenFlags.push("獨立操作且盈利，高信譽行為"); }
  if (mbti[1] === "R" && mbti[2] === "F") { reputation -= 10; redFlags.push("高風險閃電操作，信譽存疑"); }
  if (flow.exchangeFlow.length > 0) { reputation += 10; greenFlags.push("有主流交易所互動記錄"); }
  if (flow.flowType === "launderer_suspect") { reputation -= 40; redFlags.push("行為模式疑似洗錢"); }
  reputation = Math.max(0, Math.min(100, reputation));

  let consistency = 50;
  if (pattern.totalTrades > 20) { consistency += 15; greenFlags.push("長期穩定交易歷史"); }
  if (personality.confidence >= 70) { consistency += 15; greenFlags.push("行為模式高度一致"); }
  consistency = Math.max(0, Math.min(100, consistency));

  let riskExposure = 30;
  if (mbti[1] === "R") { riskExposure += 20; redFlags.push("高風險交易行為"); }
  if (flow.defiInteractions.length > 5) { riskExposure += 15; redFlags.push("大量 DeFi 協議曝險"); }
  riskExposure = Math.max(0, Math.min(100, riskExposure));

  const score = Math.round(
    (authenticity * 2) + (financialHealth * 2.5) + (reputation * 2) + (consistency * 2) + ((100 - riskExposure) * 1.5)
  );

  let level: TrustScore["level"];
  if (score >= 800) level = "very_high";
  else if (score >= 600) level = "high";
  else if (score >= 400) level = "medium";
  else if (score >= 200) level = "low";
  else level = "very_low";

  return { score, level, breakdown: { authenticity, financialHealth, reputation, consistency, riskExposure }, redFlags, greenFlags, updatedAt: new Date().toISOString() };
}

// ─── Main: Build Persona Report ───

export async function buildPersonaReport(
  address: string,
  chains: string[] = DEFAULT_CHAINS,
): Promise<PersonaReport> {
  let primaryChain = "ethereum";
  if (address.startsWith("bc1") || address.startsWith("1") || address.startsWith("3")) {
    chains = ["bitcoin"]; primaryChain = "bitcoin";
  } else if (address.length === 44 && /^[1-9A-HJ-NP-Za-km-z]{44}$/.test(address)) {
    chains = ["solana"]; primaryChain = "solana";
  }

  const endMs = Date.now();
  const beginMs = endMs - 365 * 24 * 60 * 60 * 1000;

  const [totalValue, balances, pnlOverview, tradeHistory] = await Promise.all([
    oc.withRetry(() => oc.getTotalValue(address, chains), "total-value").catch(() => ({ totalUsd: 0, chains: {} })),
    (primaryChain === "solana"
      ? Promise.resolve({ address, chains: [] } as PortfolioBalances)
      : oc.withRetry(() => oc.getAllBalances(address, chains), "all-balances").catch(() => ({ address, chains: [] } as PortfolioBalances))
    ),
    oc.withRetry(() => oc.getPortfolioOverview(address, primaryChain), "portfolio-overview").catch(() => ({
      address, totalPnlUsd: 0, winRate: 0, tradeCount: 0, avgHoldingTime: "0",
      bestTrade: { token: "", pnlUsd: 0 }, worstTrade: { token: "", pnlUsd: 0 },
    })),
    oc.withRetry(() => oc.getDexHistory(address, primaryChain, beginMs, endMs), "dex-history").catch(() => []),
  ]);

  // Fetch per-token PnL using token addresses from balances
  const tokenAddresses = (balances?.chains || [])
    .flatMap(c => c?.tokens || [])
    .sort((a, b) => b.valueUsd - a.valueUsd)
    .map(t => t.token)
    .filter(Boolean);

  let tokenPnL = await oc.withRetry(
    () => oc.getAllTokenPnL(address, primaryChain, tokenAddresses),
    "token-pnl-all",
  ).catch(() => []);

  // Dynamic chain switching
  let effectivePnlOverview = pnlOverview;
  let effectiveTokenPnL = tokenPnL;
  let effectiveTradeHistory = tradeHistory;
  let effectiveDominantChain = primaryChain;

  if (pnlOverview.tradeCount < 3 && chains.length > 1 && primaryChain !== "solana" && primaryChain !== "bitcoin") {
    const altChains = chains.filter(c => c !== primaryChain);
    for (const alt of altChains) {
      try {
        const [altPnl, altTrades] = await Promise.all([
          oc.withRetry(() => oc.getPortfolioOverview(address, alt), `pnl-${alt}`).catch(() => null),
          oc.withRetry(() => oc.getDexHistory(address, alt, beginMs, endMs), `trades-${alt}`).catch(() => []),
        ]);
        if (altPnl && altPnl.tradeCount > effectivePnlOverview.tradeCount) {
          effectivePnlOverview = altPnl;
          effectiveTradeHistory = altTrades;
          effectiveDominantChain = alt;
          // Re-fetch token PnL for the new dominant chain
          const altTokenAddresses = (balances?.chains || [])
            .flatMap(c => c?.tokens || [])
            .sort((a, b) => b.valueUsd - a.valueUsd)
            .map(t => t.token)
            .filter(Boolean);
          effectiveTokenPnL = await oc.withRetry(
            () => oc.getAllTokenPnL(address, alt, altTokenAddresses),
            `token-pnl-${alt}`,
          ).catch(() => effectiveTokenPnL);
          break;
        }
      } catch { continue; }
    }
  }

  // Derive winRate from per-token PnL if OKX returns 0
  if (effectivePnlOverview.winRate === 0 && effectiveTokenPnL.length > 0) {
    const wins = effectiveTokenPnL.filter(t => t.pnlUsd > 0).length;
    effectivePnlOverview.winRate = wins / effectiveTokenPnL.length;
  }

  // Derive bestTrade/worstTrade from per-token PnL
  if (effectiveTokenPnL.length > 0) {
    const sorted = [...effectiveTokenPnL].sort((a, b) => b.pnlUsd - a.pnlUsd);
    if (!effectivePnlOverview.bestTrade.token && sorted[0]) {
      effectivePnlOverview.bestTrade = { token: sorted[0].symbol, pnlUsd: sorted[0].pnlUsd };
    }
    if (!effectivePnlOverview.worstTrade.token && sorted[sorted.length - 1]) {
      effectivePnlOverview.worstTrade = { token: sorted[sorted.length - 1].symbol, pnlUsd: sorted[sorted.length - 1].pnlUsd };
    }
  }

  // 1. Transaction pattern
  const transactionPattern = analyzeTransactionPattern(effectiveTradeHistory, effectivePnlOverview);

  // 2. Fund flow
  const fundFlow = analyzeFundFlow(effectiveTradeHistory, balances, totalValue);

  // 3. MBTI classification (via scoring pipeline)
  const classification = classifyWithScoring(
    transactionPattern, fundFlow, effectivePnlOverview, effectiveTokenPnL, totalValue, balances,
  );

  const { mbti, axes, axisConfidences, confidence, evidence, summary, secondaryArchetypes } = classification;

  // Build radar from axes + extra dimensions
  const radar = {
    risk: axes.risk,
    activity: Math.min(100, Math.round(transactionPattern.totalTrades / 2)),
    sophistication: Math.min(100, Math.round(
      (fundFlow.defiInteractions.length * 15) + (effectivePnlOverview.winRate > 0.5 ? 20 : 0) + (totalValue.totalUsd > 50_000 ? 15 : 0)
    )),
    loyalty: Math.min(100, Math.round(
      transactionPattern.avgHoldingTimeHours > 168 ? 80 : (transactionPattern.totalTrades < 10 ? 70 : 30)
    )),
    social: axes.social,
    timing: Math.min(100, Math.round(effectivePnlOverview.winRate * 100)),
  };

  // Merge axis confidences into axes object
  const axesWithConfidence: MBTIAxes = {
    ...axes,
    energyConfidence: axisConfidences.energyConfidence,
    riskConfidence: axisConfidences.riskConfidence,
    speedConfidence: axisConfidences.speedConfidence,
    socialConfidence: axisConfidences.socialConfidence,
  };

  const personality: PersonalityPortrait = {
    mbti,
    axes: axesWithConfidence,
    confidence,
    summary,
    evidence,
    radar,
    archetype: mbti,
    secondaryArchetypes,
  };

  // 4. Trust score
  const trustScore = calculateTrustScore(transactionPattern, fundFlow, personality, effectivePnlOverview, totalValue);

  return {
    address,
    chainsScanned: chains,
    dominantChain: effectiveDominantChain,
    transactionPattern,
    fundFlow,
    personality,
    trustScore,
    generatedAt: new Date().toISOString(),
  };
}
