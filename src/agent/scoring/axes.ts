import type { SignalMap, AxisWeightConfig, AxisConfidences } from "./types.js";
import type { MBTIAxes } from "../../types/persona.js";
import { DEFAULT_CONFIG } from "./types.js";

export function computeWeightedAxis(signals: SignalMap, weights: AxisWeightConfig[]): number {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const w of weights) {
    const signal = signals[w.signalId];
    if (!signal || !signal.hasRealData) continue;
    const adjusted = w.direction === -1 ? (1 - signal.normalized) : signal.normalized;
    weightedSum += adjusted * w.weight;
    totalWeight += w.weight;
  }

  if (totalWeight === 0) return 0.5;
  return weightedSum / totalWeight;
}

export function computeAllAxes(signals: SignalMap): MBTIAxes {
  const energy = Math.round(computeWeightedAxis(signals, DEFAULT_CONFIG.energy) * 100);
  const risk = Math.round(computeWeightedAxis(signals, DEFAULT_CONFIG.risk) * 100);
  const speed = Math.round(computeWeightedAxis(signals, DEFAULT_CONFIG.speed) * 100);
  const social = Math.round(computeWeightedAxis(signals, DEFAULT_CONFIG.social) * 100);

  return {
    energy: clamp(energy, 0, 100),
    risk: clamp(risk, 0, 100),
    speed: clamp(speed, 0, 100),
    social: clamp(social, 0, 100),
  };
}

export function computeAxisConfidences(signals: SignalMap): AxisConfidences {
  return {
    energyConfidence: computeSingleAxisConfidence(signals, DEFAULT_CONFIG.energy),
    riskConfidence: computeSingleAxisConfidence(signals, DEFAULT_CONFIG.risk),
    speedConfidence: computeSingleAxisConfidence(signals, DEFAULT_CONFIG.speed),
    socialConfidence: computeSingleAxisConfidence(signals, DEFAULT_CONFIG.social),
  };
}

function computeSingleAxisConfidence(signals: SignalMap, weights: AxisWeightConfig[]): number {
  let availableWeight = 0;
  let totalWeight = 0;

  for (const w of weights) {
    totalWeight += w.weight;
    const signal = signals[w.signalId];
    if (signal && signal.hasRealData) {
      availableWeight += w.weight;
    }
  }

  if (totalWeight === 0) return 0;
  return Math.round((availableWeight / totalWeight) * 100);
}

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}
