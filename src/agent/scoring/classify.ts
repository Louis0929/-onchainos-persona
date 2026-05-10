import type { SignalMap, AxisConfidences } from "./types.js";
import type { MBTIAxes, OnchainMBTI, PersonalityPortrait } from "../../types/persona.js";
import { computeMBTI, MBTI_DESCRIPTIONS, ARCHETYPE_LABELS } from "../../types/persona.js";
import { extractSignals } from "./signals.js";
import { computeAllAxes, computeAxisConfidences } from "./axes.js";
import type { TransactionPattern, FundFlow } from "../../types/persona.js";
import type { PortfolioTotalValue, PortfolioBalances, PnLOverview, TokenPnL } from "../../types/onchainos.js";

const MEME_PATTERN = /doge|pepe|shib|floki|wojak|bonk|meme|trump|fart|ponke|neiro|mog/i;

export interface ClassificationResult {
  mbti: OnchainMBTI;
  axes: MBTIAxes;
  axisConfidences: AxisConfidences;
  confidence: number;
  evidence: string[];
  summary: string;
  secondaryArchetypes: OnchainMBTI[];
}

export function classifyWithScoring(
  pattern: TransactionPattern,
  flow: FundFlow,
  pnlOverview: PnLOverview,
  tokenPnL: TokenPnL[],
  totalValue: PortfolioTotalValue,
  balances: PortfolioBalances,
): ClassificationResult {
  // Layer 1: Extract normalized signals
  const signals = extractSignals(pattern, flow, pnlOverview, tokenPnL, totalValue, balances);

  // Layer 2: Compute axes
  const axes = computeAllAxes(signals);
  const axisConfidences = computeAxisConfidences(signals);

  // Layer 3: Classify MBTI
  const mbti = computeMBTI(axes);

  // Enhanced confidence
  const confidence = calculateConfidence(axes, signals, axisConfidences);

  // Evidence generation
  const evidence = generateEvidence(signals, mbti);

  // Summary
  const desc = MBTI_DESCRIPTIONS[mbti];
  const summary = `這個地址的鏈上人格是 ${mbti}「${desc.emoji} ${desc.name}」— ${desc.desc}。信心度 ${confidence}%。`;

  // Secondary archetype: flip the weakest axis
  const deviations = [
    { key: "energy" as const, delta: Math.abs(axes.energy - 50) },
    { key: "risk" as const, delta: Math.abs(axes.risk - 50) },
    { key: "speed" as const, delta: Math.abs(axes.speed - 50) },
    { key: "social" as const, delta: Math.abs(axes.social - 50) },
  ];
  deviations.sort((a, b) => a.delta - b.delta);
  const weakest = deviations[0].key;
  const flippedAxes = { ...axes, [weakest]: axes[weakest] >= 50 ? axes[weakest] - 50 : axes[weakest] + 50 };
  const secondaryMbti = computeMBTI(flippedAxes);

  return {
    mbti,
    axes,
    axisConfidences,
    confidence,
    evidence,
    summary,
    secondaryArchetypes: [secondaryMbti],
  };
}

function calculateConfidence(axes: MBTIAxes, signals: SignalMap, axisConfidences: AxisConfidences): number {
  // 1. Axis decisiveness (0-40)
  const axisDeviations = [axes.energy, axes.risk, axes.speed, axes.social]
    .map(v => Math.abs(v - 50));
  const avgDeviation = axisDeviations.reduce((s, v) => s + v, 0) / 4;
  const decisiveness = Math.min(40, Math.round(avgDeviation * 0.8));

  // 2. Data coverage (0-30)
  const availableSignals = Object.keys(signals).filter(k => signals[k].hasRealData).length;
  const totalSignals = Object.keys(signals).length;
  const coverage = Math.min(30, Math.round((availableSignals / totalSignals) * 30));

  // 3. Trade count weight (0-15)
  const tradeCount = signals.tx_totalTradeCount?.raw || 0;
  const tradeBonus = Math.min(15, Math.round(Math.log2(tradeCount + 1) * 2));

  // 4. PnL data presence (0-15)
  const hasPnlData = (signals.pnl_winRate?.hasRealData ?? false) && (signals.pnl_profitFactor?.hasRealData ?? false);
  const pnlBonus = hasPnlData ? 15 : 0;

  return Math.min(95, decisiveness + coverage + tradeBonus + pnlBonus);
}

function generateEvidence(signals: SignalMap, mbti: OnchainMBTI): string[] {
  const evidence: string[] = [];

  // PnL-based evidence
  const winRate = signals.pnl_winRate;
  if (winRate.hasRealData) {
    evidence.push(`勝率 ${(winRate.raw * 100).toFixed(1)}%`);
  }

  const profitFactor = signals.pnl_profitFactor;
  if (profitFactor.hasRealData) {
    if (profitFactor.raw > 1.5) evidence.push(`Profit Factor ${profitFactor.raw.toFixed(2)} — 穩定盈利者`);
    else if (profitFactor.raw < 0.5) evidence.push(`Profit Factor ${profitFactor.raw.toFixed(2)} — 嚴重虧損`);
  }

  const memePnl = signals.pnl_memePnlRatio;
  if (memePnl.hasRealData && Math.abs(memePnl.raw) > 0.3) {
    evidence.push(memePnl.raw > 0 ? "Meme 代幣獲利佔比高" : "Meme 代幣虧損佔比高");
  }

  const returnConsistency = signals.pnl_returnConsistency;
  if (returnConsistency.hasRealData) {
    if (returnConsistency.normalized > 0.7) evidence.push("回報一致性高 — 穩定策略");
    else if (returnConsistency.normalized < 0.3) evidence.push("回報波動大 — 高風險策略");
  }

  const bigLossRate = signals.pnl_bigLossRate;
  if (bigLossRate.hasRealData && bigLossRate.raw > 0.3) {
    evidence.push(`${(bigLossRate.raw * 100).toFixed(0)}% 代幣虧損超過 50%`);
  }

  const concentration = signals.pnl_concentration;
  if (concentration.hasRealData && concentration.normalized > 0.7) {
    evidence.push("盈利集中於少數交易 — 狙擊型操作");
  }

  // Rug count
  const rugCount = signals.pnl_rugCount;
  if (rugCount.hasRealData && rugCount.raw > 0) {
    evidence.push(`${rugCount.raw} 次 Rug Pull 經歷`);
  }

  // Meme ratio
  const memeRatio = signals.pnl_memeRatio;
  if (memeRatio.hasRealData && memeRatio.raw > 0.3) {
    evidence.push(`${(memeRatio.raw * 100).toFixed(0)}% Meme 代幣持倉`);
  }

  // Stable ratio
  const stableRatio = signals.pnl_stableRatio;
  if (stableRatio.hasRealData && stableRatio.raw > 0.5) {
    evidence.push(`${(stableRatio.raw * 100).toFixed(0)}% 穩定幣 — 低風險偏好`);
  }

  // Transaction pattern evidence
  const tradeFreq = signals.tx_tradeFrequency;
  if (tradeFreq.hasRealData && tradeFreq.raw > 2) {
    evidence.push("高頻交易，主動出擊");
  }

  const holdingTime = signals.tx_avgHoldingTimeNorm;
  if (holdingTime.hasRealData) {
    if (holdingTime.normalized > 0.7) evidence.push("極短持倉時間 — 閃電操作");
    else if (holdingTime.normalized < 0.3) evidence.push("長期持有 — 耐心策略");
  }

  // Fund flow evidence
  const bridgeCount = signals.flow_bridgeCount;
  if (bridgeCount.hasRealData && bridgeCount.raw > 0) {
    evidence.push(`${bridgeCount.raw} 次跨鏈操作`);
  }

  const isLaunderer = signals.flow_isLaundererSuspect;
  if (isLaunderer.hasRealData && isLaunderer.raw === 1) {
    evidence.push("資金流向碎片化，疑似洗錢模式");
  }

  // Cross-chain evidence
  const chainCount = signals.chain_activeChainCount;
  if (chainCount.hasRealData && chainCount.raw >= 3) {
    evidence.push(`${chainCount.raw} 條鏈活躍 — 跨鏈玩家`);
  }

  if (evidence.length === 0) {
    evidence.push("數據不足，使用默認分類");
  }

  return evidence;
}
