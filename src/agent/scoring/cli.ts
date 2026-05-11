import "dotenv/config";
import { buildPersonaReport } from "../persona-analyzer.js";

const args = process.argv.slice(2);
let address = "";
let chain = "ethereum";

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--address" && args[i + 1]) address = args[++i];
  else if (args[i] === "--chain" && args[i + 1]) chain = args[++i];
  else if (!address && args[i].startsWith("0x")) address = args[i];
}

if (!address) {
  console.error("Usage: npx tsx src/agent/scoring/cli.ts --address 0x... [--chain ethereum]");
  process.exit(1);
}

const chains = [chain];
if (chain === "ethereum") chains.push("base", "arbitrum");

buildPersonaReport(address, chains)
  .then(report => {
    const { personality, trustScore, transactionPattern, fundFlow } = report;
    console.log(JSON.stringify({
      address: report.address,
      mbti: personality.mbti,
      mbtiName: personality.mbti,
      axes: personality.axes,
      confidence: personality.confidence,
      evidence: personality.evidence,
      radar: personality.radar,
      trustScore: { score: trustScore.score, level: trustScore.level },
      transactionPattern: {
        totalTrades: transactionPattern.totalTrades,
        activityRhythm: transactionPattern.activityRhythm,
        medianTradeSize: transactionPattern.medianTradeSize,
      },
      fundFlowType: fundFlow.flowType,
      dominantChain: report.dominantChain,
      chainsScanned: report.chainsScanned,
    }, null, 2));
  })
  .catch(err => {
    console.error(JSON.stringify({ error: err.message }));
    process.exit(1);
  });
