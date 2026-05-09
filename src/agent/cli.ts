import { buildPersonaReport } from "./persona-analyzer.js";
import { ARCHETYPE_LABELS } from "../types/persona.js";

const address = process.argv[2];
if (!address) {
  console.error("Usage: onchainos-persona <address> [chains...]");
  console.error("Example: onchainos-persona 0x... ethereum base arbitrum");
  process.exit(1);
}

const chains = process.argv.slice(3).length > 0 ? process.argv.slice(3) : undefined;

console.log(`\n🔍 OnChainOS Persona — Analyzing ${address.slice(0, 10)}...${address.slice(-8)}\n`);

const report = await buildPersonaReport(address, chains);

console.log("═".repeat(60));
console.log(`  📋 PERSONA REPORT: ${address.slice(0, 10)}...${address.slice(-8)}`);
console.log("═".repeat(60));

console.log(`\n🎭 Personality: ${ARCHETYPE_LABELS[report.personality.archetype]} (confidence: ${report.personality.confidence}%)`);
if (report.personality.secondaryArchetypes.length > 0) {
  console.log(`   Secondary: ${report.personality.secondaryArchetypes.map(a => ARCHETYPE_LABELS[a]).join(", ")}`);
}
console.log(`\n📝 Summary: ${report.personality.summary}`);

console.log("\n📊 Evidence:");
for (const e of report.personality.evidence) {
  console.log(`   • ${e}`);
}

console.log("\n⏰ Transaction Pattern:");
console.log(`   Rhythm: ${report.transactionPattern.activityRhythm}`);
console.log(`   Total trades: ${report.transactionPattern.totalTrades}`);
console.log(`   Median size: $${Math.round(report.transactionPattern.medianTradeSize).toLocaleString()}`);
console.log(`   Weekend ratio: ${(report.transactionPattern.weekendRatio * 100).toFixed(1)}%`);

console.log("\n💰 Fund Flow:");
console.log(`   Type: ${report.fundFlow.flowType}`);
if (report.fundFlow.exchangeFlow.length > 0) {
  console.log("   Exchanges:");
  for (const ex of report.fundFlow.exchangeFlow.slice(0, 5)) {
    console.log(`     ${ex.exchange}: deposited $${Math.round(ex.deposited).toLocaleString()}, withdrawn $${Math.round(ex.withdrawn).toLocaleString()}`);
  }
}

console.log("\n🛡️ Trust Score:");
console.log(`   Score: ${report.trustScore.score}/1000 (${report.trustScore.level})`);
console.log(`   Authenticity: ${report.trustScore.breakdown.authenticity}/100`);
console.log(`   Financial Health: ${report.trustScore.breakdown.financialHealth}/100`);
console.log(`   Reputation: ${report.trustScore.breakdown.reputation}/100`);
console.log(`   Consistency: ${report.trustScore.breakdown.consistency}/100`);
console.log(`   Risk Exposure: ${report.trustScore.breakdown.riskExposure}/100`);

if (report.trustScore.redFlags.length > 0) {
  console.log("\n🚩 Red Flags:");
  for (const f of report.trustScore.redFlags) {
    console.log(`   ⚠️ ${f}`);
  }
}

if (report.trustScore.greenFlags.length > 0) {
  console.log("\n✅ Green Flags:");
  for (const f of report.trustScore.greenFlags) {
    console.log(`   ✓ ${f}`);
  }
}

console.log("\n" + "═".repeat(60));
