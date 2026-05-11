import "dotenv/config";
import { buildPersonaReport } from "./persona-analyzer.js";
import { MBTI_DESCRIPTIONS, ARCHETYPE_LABELS } from "../types/persona.js";

const address = process.argv[2];
if (!address) {
  console.error("Usage: onchainos-persona <address> [chains...]");
  console.error("Example: onchainos-persona 0x... ethereum base arbitrum");
  process.exit(1);
}

const chains = process.argv.slice(3).length > 0 ? process.argv.slice(3) : undefined;

console.log(`\n🧬 OnChainOS Persona — Analyzing ${address.slice(0, 10)}...${address.slice(-8)}\n`);

const report = await buildPersonaReport(address, chains);

const mbti = report.personality.mbti;
const desc = MBTI_DESCRIPTIONS[mbti];
const axes = report.personality.axes;

console.log("═".repeat(60));
console.log(`  🧬 PERSONA REPORT: ${address.slice(0, 10)}...${address.slice(-8)}`);
console.log("═".repeat(60));

console.log(`\n🎭 On-chain MBTI: ${mbti} — ${desc.emoji} ${desc.nameZh} (${desc.name})`);
console.log(`   ${desc.desc}`);
console.log(`   Confidence: ${report.personality.confidence}%`);
console.log(`   Secondary:  ${report.personality.secondaryArchetypes[0]} (${ARCHETYPE_LABELS[report.personality.secondaryArchetypes[0]]})`);

console.log("\n📊 MBTI Axes:");
console.log(`   Energy  (H/G):  ${"█".repeat(Math.round(axes.energy / 5))}${"░".repeat(20 - Math.round(axes.energy / 5))} ${axes.energy} → ${axes.energy >= 50 ? "H Hunter" : "G Guardian"}`);
console.log(`   Risk    (R/S):  ${"█".repeat(Math.round(axes.risk / 5))}${"░".repeat(20 - Math.round(axes.risk / 5))} ${axes.risk} → ${axes.risk >= 50 ? "R Risker" : "S Stabilizer"}`);
console.log(`   Speed   (F/P):  ${"█".repeat(Math.round(axes.speed / 5))}${"░".repeat(20 - Math.round(axes.speed / 5))} ${axes.speed} → ${axes.speed >= 50 ? "F Flash" : "P Patient"}`);
console.log(`   Social  (C/L):  ${"█".repeat(Math.round(axes.social / 5))}${"░".repeat(20 - Math.round(axes.social / 5))} ${axes.social} → ${axes.social >= 50 ? "C Crowd" : "L Lone"}`);

console.log("\n📝 Evidence:");
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
    console.log(`     ${ex.exchange}: ↓$${Math.round(ex.deposited).toLocaleString()} ↑$${Math.round(ex.withdrawn).toLocaleString()}`);
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
  for (const f of report.trustScore.redFlags) console.log(`   ⚠️ ${f}`);
}
if (report.trustScore.greenFlags.length > 0) {
  console.log("\n✅ Green Flags:");
  for (const f of report.trustScore.greenFlags) console.log(`   ✓ ${f}`);
}

console.log("\n" + "═".repeat(60));
