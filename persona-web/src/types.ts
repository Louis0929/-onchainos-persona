export type OnchainMBTI =
  | "HRFC" | "HRFL" | "HRPC" | "HRPL"
  | "HSFC" | "HSFL" | "HSPC" | "HSPL"
  | "GRFC" | "GRFL" | "GRPC" | "GRPL"
  | "GSFC" | "GSFL" | "GSPC" | "GSPL";

export interface MBTIDescription {
  emoji: string;
  name: string;
  desc: string;
}

export const MBTI_DESCRIPTIONS: Record<OnchainMBTI, MBTIDescription> = {
  HRFC: { emoji: "🎰", name: "Degen Sniper",     desc: "主動出擊、高風險、閃電決策、跟風 — 典型的 Meme 狙擊手" },
  HRFL: { emoji: "🗡️", name: "Lone Wolf",        desc: "主動出擊、高風險、閃電決策、獨行 — 反市場操作的快進快出獵人" },
  HRPC: { emoji: "🎲", name: "High Roller",      desc: "主動出擊、高風險、耐心持倉、跟風 — FOMO 進場但死扛的賭徒" },
  HRPL: { emoji: "🎭", name: "Contrarian Whale",  desc: "主動出擊、高風險、耐心持倉、獨行 — 逆勢重倉的傳奇鯨魚" },
  HSFC: { emoji: "⚡", name: "Flash Trader",     desc: "主動出擊、穩健選幣、閃電決策、跟風 — 趨勢突破時快速跟單" },
  HSFL: { emoji: "🔬", name: "Alpha Scanner",    desc: "主動出擊、穩健選幣、閃電決策、獨行 — 獨立研究後快速佈局" },
  HSPC: { emoji: "📈", name: "Trend Rider",      desc: "主動出擊、穩健選幣、耐心持倉、跟風 — 順勢而為的波段交易者" },
  HSPL: { emoji: "🎯", name: "Strategic Hunter",  desc: "主動出擊、穩健選幣、耐心持倉、獨行 — 有紀律的獨立佈局者" },
  GRFC: { emoji: "🌪️", name: "FOMO Chaser",     desc: "守勢佈局、高風險、閃電決策、跟風 — 平時謹慎但 FOMO 時追高殺低" },
  GRFL: { emoji: "🦊", name: "Shadow Fox",       desc: "守勢佈局、高風險、閃電決策、獨行 — 低調但出手就是大單" },
  GRPC: { emoji: "🐑", name: "Herd Believer",    desc: "守勢佈局、高風險、耐心持倉、跟風 — 跟著社群信念死扛" },
  GRPL: { emoji: "🐋", name: "Sleeping Whale",   desc: "守勢佈局、高風險、耐心持倉、獨行 — 沉默的重倉持有者" },
  GSFC: { emoji: "🤖", name: "Bot Farmer",       desc: "守勢佈局、穩健選幣、閃電決策、跟風 — 系統化、可能是機器人" },
  GSFL: { emoji: "🕵️", name: "Silent Operator",  desc: "守勢佈局、穩健選幣、閃電決策、獨行 — 低調套利、MEV 或做市" },
  GSPC: { emoji: "🤲", name: "Diamond Hodler",   desc: "守勢佈局、穩健選幣、耐心持倉、跟風 — 信仰型佛系持幣" },
  GSPL: { emoji: "🏔️", name: "Monk",            desc: "守勢佈局、穩健選幣、耐心持倉、獨行 — 鏈上隱士，極致自律" },
};

export interface MBTIAxes {
  energy: number;
  risk: number;
  speed: number;
  social: number;
}

export const AXIS_LABELS = {
  energy: { left: "Guardian 守勢", right: "Hunter 主動", letter: "H/G" },
  risk: { left: "Stabilizer 穩健", right: "Risker 高風險", letter: "R/S" },
  speed: { left: "Patient 耐心", right: "Flash 閃電", letter: "F/P" },
  social: { left: "Lone 獨行", right: "Crowd 群眾", letter: "C/L" },
};

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

export interface FlowNode {
  address: string;
  label: string;
  type: string;
  totalInUsd: number;
  totalOutUsd: number;
  interactionCount: number;
}

export interface FundFlow {
  topSources: FlowNode[];
  topDestinations: FlowNode[];
  defiInteractions: { protocol: string; action: string; count: number; totalUsd: number }[];
  bridgeActivity: { from: string; to: string; count: number; totalUsd: number }[];
  exchangeFlow: { exchange: string; deposited: number; withdrawn: number }[];
  flowType: string;
}

export interface PersonalityPortrait {
  mbti: OnchainMBTI;
  axes: MBTIAxes;
  confidence: number;
  summary: string;
  evidence: string[];
  radar: {
    risk: number;
    activity: number;
    sophistication: number;
    loyalty: number;
    social: number;
    timing: number;
  };
  archetype: OnchainMBTI;
  secondaryArchetypes: OnchainMBTI[];
}

export interface TrustScore {
  score: number;
  level: string;
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
