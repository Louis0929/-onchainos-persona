// ─── OnChainOS Persona Types ───

/** Transaction pattern analysis */
export interface TransactionPattern {
  /** Hourly distribution of trades (0-23), normalized to 0-1 */
  hourlyDistribution: number[];
  /** "night_owl" | "early_bird" | "machine" | "balanced" */
  activityRhythm: string;
  /** Average trades per day */
  tradeFrequency: number;
  /** Total trade count */
  totalTrades: number;
  /** Median trade size in USD */
  medianTradeSize: number;
  /** Trade size distribution: { small: <100, medium: 100-10k, large: 10k-100k, whale: >100k } */
  sizeDistribution: { small: number; medium: number; large: number; whale: number };
  /** Average holding time in hours */
  avgHoldingTimeHours: number;
  /** Weekend vs weekday trade ratio */
  weekendRatio: number;
}

/** Fund flow node — an entity the address interacts with */
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
  /** Top sources of funds flowing IN */
  topSources: FlowNode[];
  /** Top destinations of funds flowing OUT */
  topDestinations: FlowNode[];
  /** DeFi protocol interactions */
  defiInteractions: { protocol: string; action: string; count: number; totalUsd: number }[];
  /** Bridge activity */
  bridgeActivity: { from: string; to: string; count: number; totalUsd: number }[];
  /** Exchange deposit/withdrawal summary */
  exchangeFlow: { exchange: string; deposited: number; withdrawn: number }[];
  /** Overall flow classification */
  flowType: "saver" | "trader" | "farmer" | "launderer_suspect" | "bridge_hopper" | "hodler";
}

/** Personality archetype */
export type PersonaArchetype =
  | "whale"           // 🐋 大鯨魚 — high value, low frequency
  | "degen"           // 🎰 Degen — high risk, meme-heavy
  | "diamond_hands"   // 💎 鑽石手 — long hold, low sell
  | "paper_hands"     // 🧻 紙手 — quick panic sell
  | "market_maker"    // 🏭 做市商 — high frequency, small spread
  | "gambler"         // 🎲 賭徒 — all-in patterns, meme/rug
  | "farmer"          // 🌾 農夫 — DeFi yield farming
  | "project_dev"     // 👨‍💻 項目方 — contract deploys, team wallets
  | "retail"          // 🛒 散戶 — small amounts, trend-following
  | "launderer"       // 🌀 洗錢嫌疑 — rapid cross-chain, fragmented
  | "hodler"          // 🤲 鑽石手佛系持幣 — very low activity
  | "bridge_hopper";  // 🌉 跨鏈玩家 — frequent bridging

export const ARCHETYPE_LABELS: Record<PersonaArchetype, string> = {
  whale: "🐋 大鯨魚",
  degen: "🎰 Degen",
  diamond_hands: "💎 鑽石手",
  paper_hands: "🧻 紙手",
  market_maker: "🏭 做市商",
  gambler: "🎲 賭徒",
  farmer: "🌾 農夫",
  project_dev: "👨‍💻 項目方",
  retail: "🛒 散戶",
  launderer: "🌀 洗錢嫌疑",
  hodler: "🤲 佛系持幣",
  bridge_hopper: "🌉 跨鏈玩家",
};

/** Personality portrait */
export interface PersonalityPortrait {
  /** Primary archetype */
  archetype: PersonaArchetype;
  /** Confidence 0-100 */
  confidence: number;
  /** Secondary traits */
  secondaryArchetypes: PersonaArchetype[];
  /** Human-readable description */
  summary: string;
  /** Key evidence supporting this classification */
  evidence: string[];
  /** Personality radar: 6-axis scores 0-100 */
  radar: {
    risk: number;        // 風險偏好
    activity: number;    // 活躍度
    sophistication: number; // 專業度
    loyalty: number;     // 持有忠誠度
    social: number;      // 社交互動度
    timing: number;      // 時機把握
  };
}

/** Trust score — reusable for ExChain, lending, due diligence */
export interface TrustScore {
  /** Overall trust score 0-1000 */
  score: number;
  /** Risk level */
  level: "very_high" | "high" | "medium" | "low" | "very_low";
  /** Sub-scores */
  breakdown: {
    /** Is this a real human? (vs bot/sybil) */
    authenticity: number;     // 0-100
    /** Financial responsibility */
    financialHealth: number;  // 0-100
    /** On-chain reputation */
    reputation: number;       // 0-100
    /** Behavioral consistency over time */
    consistency: number;      // 0-100
    /** Exposure to risky protocols/addresses */
    riskExposure: number;     // 0-100 (higher = more risky)
  };
  /** Red flags */
  redFlags: string[];
  /** Green flags */
  greenFlags: string[];
  /** Last updated timestamp */
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
