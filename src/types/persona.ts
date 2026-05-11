// ─── OnChainOS Persona Types ───
// Inspired by MBTI — 4 binary axes create 16 on-chain personality types

/**
 * On-chain MBTI: 4 axes, 2 letters each
 *
 * Axis 1: Energy Source (how they enter the market)
 *   H = Hunter (主動出擊 — seeks new tokens, early entry, FOMO-driven)
 *   G = Guardian (守勢佈局 — researches first, waits for confirmation, disciplined)
 *
 * Axis 2: Risk Appetite (how much risk they take)
 *   R = Risker (高風險偏好 — meme, leverage, all-in, degen plays)
 *   S = Stabilizer (低風險偏好 — blue chips, stablecoins, DCA)
 *
 * Axis 3: Decision Speed (how fast they act)
 *   F = Flash (閃電決策 — snipers, MEV, instant in/out, scalping)
 *   P = Patient (耐心決策 — long hold, fundamental analysis, slow DCA)
 *
 * Axis 4: Social Mode (how they interact on-chain)
 *   C = Crowd (群眾追隨 — follows trends, copy-trades, herd behavior)
 *   L = Lone (獨行俠 — unique paths, contra-trades, anti-herd)
 *
 * 16 types: HRFC, HRFL, HRPC, HRPL, HSFC, HSFL, HSPC, HSPL,
 *           GRFC, GRFL, GRPC, GRPL, GSFC, GSFL, GSPC, GSPL
 */

export type OnchainMBTI =
  | "HRFC" | "HRFL" | "HRPC" | "HRPL"
  | "HSFC" | "HSFL" | "HSPC" | "HSPL"
  | "GRFC" | "GRFL" | "GRPC" | "GRPL"
  | "GSFC" | "GSFL" | "GSPC" | "GSPL";

export const MBTI_DESCRIPTIONS: Record<OnchainMBTI, { emoji: string; name: string; nameZh: string; desc: string }> = {
  HRFC: { emoji: "🎰", name: "Degen Sniper",     nameZh: "賭徒狙擊手", desc: "主動出擊、高風險、閃電決策、跟風 — 典型的 Meme 狙擊手" },
  HRFL: { emoji: "🗡️", name: "Lone Wolf",        nameZh: "獨行狼",    desc: "主動出擊、高風險、閃電決策、獨行 — 反市場操作的快進快出獵人" },
  HRPC: { emoji: "🎲", name: "High Roller",      nameZh: "豪賭客",    desc: "主動出擊、高風險、耐心持倉、跟風 — FOMO 進場但死扛的賭徒" },
  HRPL: { emoji: "🎭", name: "Contrarian Whale",  nameZh: "逆勢巨鯨",  desc: "主動出擊、高風險、耐心持倉、獨行 — 逆勢重倉的傳奇鯨魚" },
  HSFC: { emoji: "⚡", name: "Flash Trader",     nameZh: "閃電交易者", desc: "主動出擊、穩健選幣、閃電決策、跟風 — 趨勢突破時快速跟單" },
  HSFL: { emoji: "🔬", name: "Alpha Scanner",    nameZh: "先鋒獵手",   desc: "主動出擊、穩健選幣、閃電決策、獨行 — 獨立研究後快速佈局" },
  HSPC: { emoji: "📈", name: "Trend Rider",      nameZh: "趨勢騎士",   desc: "主動出擊、穩健選幣、耐心持倉、跟風 — 順勢而為的波段交易者" },
  HSPL: { emoji: "🎯", name: "Strategic Hunter",  nameZh: "策略獵人",   desc: "主動出擊、穩健選幣、耐心持倉、獨行 — 有紀律的獨立佈局者" },
  GRFC: { emoji: "🌪️", name: "FOMO Chaser",     nameZh: "FOMO 追逐者", desc: "守勢佈局、高風險、閃電決策、跟風 — 平時謹慎但 FOMO 時追高殺低" },
  GRFL: { emoji: "🦊", name: "Shadow Fox",       nameZh: "暗影狐狸",   desc: "守勢佈局、高風險、閃電決策、獨行 — 低調但出手就是大單" },
  GRPC: { emoji: "🐑", name: "Herd Believer",    nameZh: "羊群信徒",   desc: "守勢佈局、高風險、耐心持倉、跟風 — 跟著社群信念死扛" },
  GRPL: { emoji: "🐋", name: "Sleeping Whale",   nameZh: "沉睡巨鯨",   desc: "守勢佈局、高風險、耐心持倉、獨行 — 沉默的重倉持有者" },
  GSFC: { emoji: "🤖", name: "Bot Farmer",       nameZh: "機器人農夫", desc: "守勢佈局、穩健選幣、閃電決策、跟風 — 系統化、可能是機器人" },
  GSFL: { emoji: "🕵️", name: "Silent Operator",  nameZh: "無聲操盤手", desc: "守勢佈局、穩健選幣、閃電決策、獨行 — 低調套利、MEV 或做市" },
  GSPC: { emoji: "🤲", name: "Diamond Hodler",   nameZh: "鑽石佛系手", desc: "守勢佈局、穩健選幣、耐心持倉、跟風 — 信仰型佛系持幣" },
  GSPL: { emoji: "🏔️", name: "Monk",            nameZh: "鏈上隱士",   desc: "守勢佈局、穩健選幣、耐心持倉、獨行 — 極致自律" },
};

/** Legacy archetype (kept for compatibility, mapped from MBTI) */
export type PersonaArchetype = OnchainMBTI;

export const ARCHETYPE_LABELS: Record<OnchainMBTI, string> = Object.fromEntries(
  Object.entries(MBTI_DESCRIPTIONS).map(([k, v]) => [k, `${v.emoji} ${v.nameZh}`]),
) as Record<OnchainMBTI, string>;

// ─── MBTI Axis scores ───

export interface MBTIAxes {
  /** Energy: 0-100, >50 = Hunter, <50 = Guardian */
  energy: number;
  /** Risk: 0-100, >50 = Risker, <50 = Stabilizer */
  risk: number;
  /** Speed: 0-100, >50 = Flash, <50 = Patient */
  speed: number;
  /** Social: 0-100, >50 = Crowd, <50 = Lone */
  social: number;
  /** Per-axis confidence 0-100 */
  energyConfidence?: number;
  riskConfidence?: number;
  speedConfidence?: number;
  socialConfidence?: number;
}

export function computeMBTI(axes: MBTIAxes): OnchainMBTI {
  const e = axes.energy >= 50 ? "H" : "G";
  const r = axes.risk >= 50 ? "R" : "S";
  const s = axes.speed >= 50 ? "F" : "P";
  const c = axes.social >= 50 ? "C" : "L";
  return `${e}${r}${s}${c}` as OnchainMBTI;
}

export function mbtiToAxes(mbti: OnchainMBTI): MBTIAxes {
  return {
    energy: mbti[0] === "H" ? 70 : 30,
    risk: mbti[1] === "R" ? 70 : 30,
    speed: mbti[2] === "F" ? 70 : 30,
    social: mbti[3] === "C" ? 70 : 30,
  };
}

// ─── Data types ───

/** Transaction pattern analysis */
export interface TransactionPattern {
  hourlyDistribution: number[];
  activityRhythm: string;
  tradeFrequency: number;
  totalTrades: number;
  medianTradeSize: number;
  sizeDistribution: { small: number; medium: number; large: number; whale: number };
  avgHoldingTimeHours: number;
  weekendRatio: number;
}

/** Fund flow node */
export interface FlowNode {
  address: string;
  label: string;
  type: "exchange" | "defi" | "nft" | "bridge" | "wallet" | "contract" | "unknown";
  totalInUsd: number;
  totalOutUsd: number;
  interactionCount: number;
}

/** Fund flow summary */
export interface FundFlow {
  topSources: FlowNode[];
  topDestinations: FlowNode[];
  defiInteractions: { protocol: string; action: string; count: number; totalUsd: number }[];
  bridgeActivity: { from: string; to: string; count: number; totalUsd: number }[];
  exchangeFlow: { exchange: string; deposited: number; withdrawn: number }[];
  flowType: "saver" | "trader" | "farmer" | "launderer_suspect" | "bridge_hopper" | "hodler";
}

/** Personality portrait — MBTI style */
export interface PersonalityPortrait {
  /** MBTI type e.g. HRFC */
  mbti: OnchainMBTI;
  /** Axis scores (continuous values for radar chart) */
  axes: MBTIAxes;
  /** Confidence 0-100 */
  confidence: number;
  /** Human-readable description */
  summary: string;
  /** Key evidence supporting this classification */
  evidence: string[];
  /** Personality radar: 6-axis scores 0-100 */
  radar: {
    risk: number;
    activity: number;
    sophistication: number;
    loyalty: number;
    social: number;
    timing: number;
  };
  /** Backward compat */
  archetype: OnchainMBTI;
  secondaryArchetypes: OnchainMBTI[];
}

/** Trust score — reusable for lending, KYC, due diligence */
export interface TrustScore {
  score: number;
  level: "very_high" | "high" | "medium" | "low" | "very_low";
  breakdown: {
    authenticity: number;
    financialHealth: number;
    reputation: number;
    consistency: number;
    riskExposure: number;
  };
  redFlags: string[];
  greenFlags: string[];
  updatedAt: string;
}

/** Full persona report */
export interface PersonaReport {
  address: string;
  chainsScanned: string[];
  dominantChain: string;
  transactionPattern: TransactionPattern;
  fundFlow: FundFlow;
  personality: PersonalityPortrait;
  trustScore: TrustScore;
  generatedAt: string;
}

/** API request */
export interface PersonaRequest {
  address: string;
  chains?: string[];
  depth?: "quick" | "standard" | "deep";
}

/** API response */
export interface PersonaResponse {
  report: PersonaReport;
  meta: {
    processingTimeMs: number;
    chainsScanned: string[];
    dataPoints: number;
  };
}
