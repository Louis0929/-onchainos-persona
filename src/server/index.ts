import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { buildPersonaReport } from "../agent/persona-analyzer.js";
import type { PersonaRequest, PersonaResponse } from "../types/persona.js";

const app = express();
const PORT = process.env.PORT || 3102;

app.use(cors({ origin: ["http://localhost:5186", "http://localhost:3102"] }));
app.use(express.json());
app.use(rateLimit({ windowMs: 60_000, max: 20, message: { error: "Too many requests", code: "RATE_LIMITED" } }));

app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "onchainos-persona" }));

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

    const chains = body.chains;
    const report = await buildPersonaReport(body.address, chains);

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

// Trust score only endpoint — lightweight, for third-party integration
app.post("/api/trust-score", async (req, res, next) => {
  try {
    const { address, chains } = req.body as { address: string; chains?: string[] };

    if (!address) {
      res.status(400).json({ error: "address is required", code: "INVALID_REQUEST" });
      return;
    }

    const report = await buildPersonaReport(address, chains);

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

// Radar endpoint — for UI visualization
app.post("/api/radar", async (req, res, next) => {
  try {
    const { address, chains } = req.body as { address: string; chains?: string[] };

    if (!address) {
      res.status(400).json({ error: "address is required", code: "INVALID_REQUEST" });
      return;
    }

    const report = await buildPersonaReport(address, chains);

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

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("API error:", err.message);
  res.status(500).json({ error: "Internal server error", code: "INTERNAL_ERROR" });
});

app.listen(PORT, () => console.log(`OnChainOS Persona API running on :${PORT}`));
