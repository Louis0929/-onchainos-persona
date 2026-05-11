import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { buildPersonaReport } from "../agent/persona-analyzer.js";
import type { PersonaRequest, PersonaResponse, PersonaReport, OnchainMBTI } from "../types/persona.js";

const app = express();
const PORT = process.env.PORT || 3102;
// Mock mode: only when explicitly set, OR when no API key AND no onchainos CLI found
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
const ONCHAINOS_DEFAULT_PATHS = os.platform() === "win32"
  ? [path.join(os.homedir(), ".local", "bin", "onchainos.exe"), "onchainos.exe"]
  : [path.join(os.homedir(), ".local", "bin", "onchainos"), "/usr/local/bin/onchainos"];
const CLI_EXISTS = ONCHAINOS_DEFAULT_PATHS.some(p => existsSync(p));
const MOCK_MODE = process.env.MOCK_MODE === "1" || (!process.env.OKX_API_KEY && !process.env.OKX_ACCESS_TOKEN && !CLI_EXISTS);

app.use(cors({ origin: ["http://localhost:5186", "http://localhost:3102"] }));
app.use(express.json());
app.use(rateLimit({ windowMs: 60_000, max: 20, message: { error: "Too many requests", code: "RATE_LIMITED" } }));

app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "onchainos-persona", mock: MOCK_MODE }));

// ─── Mock data generator ───

function generateMockReport(address: string): PersonaReport {
  // Deterministic pseudo-random based on address
  const seed = address.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  const rand = (i: number) => ((seed * (i + 1) * 9301 + 49297) % 233280) / 233280;

  const totalUsd = Math.round(rand(1) * 500_000 + 500);
  const winRate = 0.25 + rand(2) * 0.5;
  const totalTrades = Math.round(rand(3) * 300 + 5);
  const tradeCount = totalTrades;
  const totalPnlUsd = Math.round((rand(4) > 0.5 ? 1 : -1) * rand(5) * 50_000);

  // Generate hourly distribution (some addresses are night owls, some bots)
  const hourlyDistribution = new Array(24).fill(0).map((_, i) => {
    if (rand(6) > 0.7) return 0.3 + rand(i) * 0.7; // active hour
    return rand(i + 100) * 0.3; // quiet hour
  });

  // MBTI-style scores
  const energy = Math.round(20 + rand(7) * 60);
  const risk = Math.round(20 + rand(8) * 60);
  const speed = Math.round(20 + rand(9) * 60);
  const social = Math.round(20 + rand(10) * 60);

  const mbtiChars = [
    energy >= 50 ? "H" : "G",
    risk >= 50 ? "R" : "S",
    speed >= 50 ? "F" : "P",
    social >= 50 ? "C" : "L",
  ];
  const mbti = mbtiChars.join("") as OnchainMBTI;

  // Mock token PnL
  const tokenSymbols = ["ETH", "BTC", "PEPE", "UNI", "DOGE", "USDC", "ARB", "LINK", "SHIB", "AAVE", "MATIC", "OP"];
  const memePattern = /PEPE|DOGE|SHIB/i;
  const tokenPnL = tokenSymbols.map((symbol, i) => ({
    token: symbol,
    symbol,
    buyUsd: Math.round(rand(20 + i) * 10_000),
    sellUsd: Math.round(rand(30 + i) * 8_000),
    pnlUsd: Math.round((rand(40 + i) > 0.4 ? 1 : -1) * rand(50 + i) * 5_000),
    pnlPercent: Math.round(((rand(60 + i) > 0.4 ? 1 : -1) * rand(70 + i) * 80 + Number.EPSILON) * 100) / 100,
    holdingAmount: Math.round(rand(80 + i) * 1000),
    holdingValueUsd: Math.round(rand(90 + i) * 20_000),
  }));

  const memeTokens = tokenPnL.filter(t => memePattern.test(t.symbol));
  const memeRatio = memeTokens.length / tokenPnL.length;
  const gains = tokenPnL.filter(t => t.pnlUsd > 0).reduce((s, t) => s + t.pnlUsd, 0);
  const losses = Math.abs(tokenPnL.filter(t => t.pnlUsd < 0).reduce((s, t) => s + t.pnlUsd, 0));
  const profitFactor = losses > 0 ? gains / losses : (gains > 0 ? 10 : 0);
  const rugCount = tokenPnL.filter(t => t.pnlPercent < -80).length;
  const highLossCount = tokenPnL.filter(t => t.pnlPercent < -50).length;
  const bigWins = tokenPnL.filter(t => t.pnlPercent > 50).length;
  const bigLosses = tokenPnL.filter(t => t.pnlPercent < -50).length;
  const avgReturn = tokenPnL.reduce((s, t) => s + t.pnlPercent, 0) / tokenPnL.length;
  const variance = tokenPnL.reduce((s, t) => s + (t.pnlPercent - avgReturn) ** 2, 0) / (tokenPnL.length - 1);
  const stddev = Math.sqrt(variance);

  const evidence: string[] = [];
  if (winRate > 0.6) evidence.push(`勝率 ${(winRate * 100).toFixed(1)}%`);
  else if (winRate < 0.35) evidence.push(`勝率 ${(winRate * 100).toFixed(1)}%，高風險行為`);
  if (profitFactor > 1.5) evidence.push(`Profit Factor ${profitFactor.toFixed(2)} — 穩定盈利者`);
  else if (profitFactor < 0.5) evidence.push(`Profit Factor ${profitFactor.toFixed(2)} — 嚴重虧損`);
  if (memeRatio > 0.3) evidence.push(`${(memeRatio * 100).toFixed(0)}% Meme 代幣持倉`);
  if (rugCount > 0) evidence.push(`${rugCount} 次 Rug Pull 經歷`);
  if (highLossCount > 2) evidence.push(`${highLossCount} 筆高虧損交易`);
  if (totalTrades > 100) evidence.push("高頻交易，主動出擊");
  if (stddev < 30) evidence.push("回報一致性高 — 穩定策略");
  else if (stddev > 60) evidence.push("回報波動大 — 高風險策略");
  if (bigLosses / tokenPnL.length > 0.3) evidence.push(`${((bigLosses / tokenPnL.length) * 100).toFixed(0)}% 代幣虧損超過 50%`);

  return {
    address,
    chainsScanned: ["ethereum", "base", "arbitrum"],
    dominantChain: "ethereum",
    transactionPattern: {
      hourlyDistribution,
      activityRhythm: rand(6) > 0.8 ? "machine" : (rand(11) > 0.6 ? "night_owl" : "balanced"),
      tradeFrequency: totalTrades / 365,
      totalTrades,
      medianTradeSize: Math.round(rand(12) * 5000 + 50),
      sizeDistribution: {
        small: Math.round(rand(13) * 30),
        medium: Math.round(rand(14) * 50),
        large: Math.round(rand(15) * 20),
        whale: Math.round(rand(16) * 5),
      },
      avgHoldingTimeHours: Math.round(rand(17) * 2000),
      weekendRatio: 0.15 + rand(18) * 0.25,
    },
    fundFlow: {
      topSources: [],
      topDestinations: [],
      defiInteractions: [
        { protocol: "uniswap", action: "swap", count: Math.round(rand(19) * 20), totalUsd: Math.round(rand(20) * 100_000) },
        { protocol: "aave", action: "deposit", count: Math.round(rand(21) * 5), totalUsd: Math.round(rand(22) * 50_000) },
      ],
      bridgeActivity: rand(23) > 0.7 ? [{ from: "ethereum", to: "Stargate", count: 2, totalUsd: Math.round(rand(24) * 10_000) }] : [],
      exchangeFlow: [
        { exchange: "Binance", deposited: Math.round(rand(25) * 50_000), withdrawn: Math.round(rand(26) * 40_000) },
        { exchange: "OKX", deposited: Math.round(rand(27) * 20_000), withdrawn: Math.round(rand(28) * 15_000) },
      ],
      flowType: rand(29) > 0.8 ? "farmer" : (rand(30) > 0.7 ? "trader" : "saver"),
    },
    personality: {
      mbti,
      axes: {
        energy,
        risk,
        speed,
        social,
        energyConfidence: Math.round(50 + rand(31) * 40),
        riskConfidence: Math.round(50 + rand(32) * 40),
        speedConfidence: Math.round(50 + rand(33) * 40),
        socialConfidence: Math.round(50 + rand(34) * 40),
      },
      confidence: Math.round(40 + rand(35) * 50),
      summary: `這個地址的鏈上人格是 ${mbti} — 由 Mock 模式生成。Profit Factor: ${profitFactor.toFixed(2)}，勝率: ${(winRate * 100).toFixed(1)}%。`,
      evidence: evidence.length > 0 ? evidence : ["Mock 模式 — 使用模擬數據"],
      radar: {
        risk,
        activity: Math.min(100, Math.round(totalTrades / 2)),
        sophistication: Math.min(100, Math.round(50 + rand(36) * 40)),
        loyalty: Math.min(100, Math.round(rand(37) > 0.5 ? 70 : 30)),
        social,
        timing: Math.min(100, Math.round(winRate * 100)),
      },
      archetype: mbti,
      secondaryArchetypes: ["HSPL" as OnchainMBTI],
    },
    trustScore: {
      score: Math.round(200 + rand(38) * 600),
      level: ["low", "medium", "high"][Math.floor(rand(39) * 3)] as any,
      breakdown: {
        authenticity: Math.round(30 + rand(40) * 60),
        financialHealth: Math.round(30 + rand(41) * 60),
        reputation: Math.round(30 + rand(42) * 60),
        consistency: Math.round(30 + rand(43) * 60),
        riskExposure: Math.round(10 + rand(44) * 50),
      },
      redFlags: rand(45) > 0.6 ? ["高風險交易行為"] : [],
      greenFlags: ["有主流交易所互動記錄", "長期穩定交易歷史"],
      updatedAt: new Date().toISOString(),
    },
    generatedAt: new Date().toISOString(),
  };
}

// ─── Routes ───

app.post("/api/persona", async (req, res, next) => {
  const startTime = Date.now();
  try {
    const body = req.body as PersonaRequest;

    if (!body.address) {
      res.status(400).json({ error: "address is required", code: "INVALID_REQUEST" });
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(body.address) &&
        !body.address.startsWith("bc1") &&
        !/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(body.address) &&
        !/^[1-9A-HJ-NP-Za-km-z]{44}$/.test(body.address)) {
      res.status(400).json({ error: "invalid address format", code: "INVALID_ADDRESS" });
      return;
    }

    const report = MOCK_MODE
      ? generateMockReport(body.address)
      : await buildPersonaReport(body.address, body.chains);

    const response: PersonaResponse = {
      report,
      meta: {
        processingTimeMs: Date.now() - startTime,
        chainsScanned: report.chainsScanned,
        dataPoints: report.transactionPattern.totalTrades + report.fundFlow.topSources.length + report.fundFlow.topDestinations.length,
      },
    };

    res.json(response);
  } catch (err) {
    next(err);
  }
});

app.post("/api/trust-score", async (req, res, next) => {
  try {
    const { address, chains } = req.body as { address: string; chains?: string[] };

    if (!address) {
      res.status(400).json({ error: "address is required", code: "INVALID_REQUEST" });
      return;
    }

    const report = MOCK_MODE
      ? generateMockReport(address)
      : await buildPersonaReport(address, chains);

    res.json({
      address,
      trustScore: report.trustScore,
      archetype: report.personality.archetype,
      confidence: report.personality.confidence,
    });
  } catch (err) {
    next(err);
  }
});

app.post("/api/radar", async (req, res, next) => {
  try {
    const { address, chains } = req.body as { address: string; chains?: string[] };

    if (!address) {
      res.status(400).json({ error: "address is required", code: "INVALID_REQUEST" });
      return;
    }

    const report = MOCK_MODE
      ? generateMockReport(address)
      : await buildPersonaReport(address, chains);

    res.json({
      address,
      archetype: report.personality.archetype,
      radar: report.personality.radar,
      evidence: report.personality.evidence,
      transactionPattern: {
        rhythm: report.transactionPattern.activityRhythm,
        totalTrades: report.transactionPattern.totalTrades,
        medianTradeSize: report.transactionPattern.medianTradeSize,
      },
      fundFlowType: report.fundFlow.flowType,
    });
  } catch (err) {
    next(err);
  }
});

// Similar addresses endpoint — recommends addresses with the same MBTI type
app.post("/api/similar", async (req, res, next) => {
  try {
    const { address, chains } = req.body as { address: string; chains?: string[] };

    if (!address) {
      res.status(400).json({ error: "address is required", code: "INVALID_REQUEST" });
      return;
    }

    const report = MOCK_MODE
      ? generateMockReport(address)
      : await buildPersonaReport(address, chains);

    const mbti = report.personality.mbti;
    const totalUsd = report.transactionPattern.totalTrades > 0
      ? Math.round(Math.abs(report.personality.axes.energy + report.personality.axes.risk) * 500)
      : 0;

    // In mock mode, generate fake similar addresses
    // In production, this would query a database of previously analyzed addresses
    const similarAddresses = MOCK_MODE
      ? generateMockSimilarAddresses(mbti, address)
      : [];

    res.json({
      address,
      mbti,
      similar: similarAddresses,
      note: MOCK_MODE
        ? "Mock 模式下的推薦地址為模擬數據。連接真實數據源後，將根據相同 MBTI 類型、相近信任分數和行為特徵推薦地址。"
        : "基於相同 MBTI 類型及相近行為特徵的推薦地址",
    });
  } catch (err) {
    next(err);
  }
});

function generateMockSimilarAddresses(mbti: OnchainMBTI, originalAddress: string): { address: string; mbti: OnchainMBTI; similarity: number; totalUsd: number; note: string }[] {
  // Famous whale/degen addresses (public knowledge)
  const KNOWN_ADDRESSES: { address: string; name: string; mbti: OnchainMBTI; note: string }[] = [
    { address: "0x28c6c06298d514db089934071355e5743bf21d60", name: "Binance Hot Wallet", mbti: "GSFC", note: "交易所熱錢包" },
    { address: "0xbe0eb53f46cd790cd13851d5eff43d12404d33e8", name: "Binance 7", mbti: "GSFC", note: "交易所地址" },
    { address: "0x00000000219ab540356cbb839cbe05303d7705fa", name: "ETH2 Deposit", mbti: "GSPL", note: "質押地址" },
    { address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", name: "Vitalik.eth", mbti: "HRPL", note: "以太坊創辦人" },
    { address: "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B", name: "Vitalik Old", mbti: "HSPL", note: "早期地址" },
    { address: "0x1DB2b6eAc5a1c0c8B6A6E8B9a1c0D8e2F3A4B5C6", name: "Smart Money A", mbti: "HRFC", note: "Meme 狙擊手" },
    { address: "0x2eC5F1a03B6F0E3c8d9A1b2C3d4E5f6A7B8c9D0E", name: "Smart Money B", mbti: "HSFL", note: "Alpha 獵手" },
    { address: "0x3a1b2C3d4E5f6A7B8c9D0e1F2a3B4c5D6e7F8a9B", name: "Whale C", mbti: "GRPL", note: "沉睡巨鯨" },
    { address: "0x4b2C3D4e5F6a7B8c9D0e1F2A3b4C5d6E7f8A9b0C", name: "DeFi Farmer", mbti: "HSPC", note: "DeFi 農夫" },
    { address: "0x5c3D4E5f6A7b8C9d0E1f2A3B4c5D6e7F8a9B0c1D", name: "Degen D", mbti: "HRPC", note: "豪賭客" },
  ];

  // Find same MBTI first, then adjacent types
  const sameType = KNOWN_ADDRESSES.filter(a => a.mbti === mbti && a.address !== originalAddress);
  const adjacentTypes = KNOWN_ADDRESSES.filter(a => a.mbti !== mbti && a.address !== originalAddress);

  const results = [
    ...sameType.map(a => ({ address: a.address, mbti: a.mbti, similarity: 0.9 + Math.random() * 0.08, totalUsd: Math.round(Math.random() * 1_000_000 + 100_000), note: a.note })),
    ...adjacentTypes.slice(0, 3).map(a => ({ address: a.address, mbti: a.mbti, similarity: 0.5 + Math.random() * 0.3, totalUsd: Math.round(Math.random() * 500_000 + 50_000), note: a.note })),
  ].sort((a, b) => b.similarity - a.similarity).slice(0, 5);

  return results;
}

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("API error:", err.message);
  res.status(500).json({ error: "Internal server error", code: "INTERNAL_ERROR" });
});

app.listen(PORT, () => console.log(`OnChainOS Persona API running on :${PORT}${MOCK_MODE ? " (MOCK MODE)" : ""}`));
