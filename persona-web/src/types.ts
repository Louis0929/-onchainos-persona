export type PersonaArchetype =
  | "whale" | "degen" | "diamond_hands" | "paper_hands" | "market_maker"
  | "gambler" | "farmer" | "project_dev" | "retail" | "launderer"
  | "hodler" | "bridge_hopper";

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
  archetype: PersonaArchetype;
  confidence: number;
  secondaryArchetypes: PersonaArchetype[];
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
