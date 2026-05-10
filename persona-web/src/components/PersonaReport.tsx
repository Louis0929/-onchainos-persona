import type { PersonaReport as PersonaReportType, OnchainMBTI, MBTIAxes } from "../types";
import { MBTI_DESCRIPTIONS, AXIS_LABELS } from "../types";

const RADAR_LABELS = ["風險偏好", "活躍度", "專業度", "忠誠度", "社交度", "時機把握"];
const RADAR_KEYS = ["risk", "activity", "sophistication", "loyalty", "social", "timing"] as const;

const RHYTHM_LABEL: Record<string, string> = {
  night_owl: "🦉 夜貓子", early_bird: "🌅 早鳥", machine: "🤖 機器人模式", balanced: "⚖️ 均衡",
};

const FLOW_LABEL: Record<string, string> = {
  saver: "💰 儲蓄型", trader: "📈 交易型", farmer: "🌾 農夫型",
  launderer_suspect: "🌀 洗錢嫌疑", bridge_hopper: "🌉 跨鏈型", hodler: "🤲 佛系持有",
};

function TrustBar({ value, max = 100, label, color }: { value: number; max?: number; label: string; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="text-gray-300">{value}</span>
      </div>
      <div className="h-2 bg-cyber-dark rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function RadarChart({ radar }: { radar: PersonaReportType["personality"]["radar"] }) {
  const values = RADAR_KEYS.map(k => radar[k]);
  const cx = 120, cy = 120, r = 90;
  const n = 6;
  const angleStep = (2 * Math.PI) / n;

  const point = (i: number, val: number) => {
    const angle = angleStep * i - Math.PI / 2;
    const dist = (val / 100) * r;
    return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle) };
  };

  const gridRings = [25, 50, 75, 100];
  const axisPoints = Array.from({ length: n }, (_, i) => point(i, 100));
  const dataPoints = values.map((v, i) => point(i, v));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  return (
    <div className="flex flex-col items-center">
      <svg width="240" height="240" viewBox="0 0 240 240">
        {gridRings.map(ringR => {
          const pts = Array.from({ length: n }, (_, i) => point(i, ringR));
          const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
          return <path key={ringR} d={d} fill="none" stroke="#2a2a5a" strokeWidth="0.5" />;
        })}
        {axisPoints.map((p, i) => (
          <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#2a2a5a" strokeWidth="0.5" />
        ))}
        <path d={dataPath} fill="#00f0ff15" stroke="#00f0ff" strokeWidth="1.5" />
        {dataPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#00f0ff" />
        ))}
        {axisPoints.map((p, i) => {
          const labelPt = point(i, 115);
          return (
            <text key={i} x={labelPt.x} y={labelPt.y} textAnchor="middle" dominantBaseline="middle"
              fill="#888" fontSize="9" fontFamily="JetBrains Mono, monospace">
              {RADAR_LABELS[i]}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function MBTIBadge({ mbti }: { mbti: OnchainMBTI }) {
  const desc = MBTI_DESCRIPTIONS[mbti];
  return (
    <div className="flex items-center gap-2">
      <span className="text-3xl">{desc.emoji}</span>
      <div>
        <div className="text-xs text-gray-500 font-mono tracking-wider">{mbti}</div>
        <div className="text-lg font-bold text-cyber-accent">{desc.name}</div>
      </div>
    </div>
  );
}

function AxisBar({ axis, value }: { axis: keyof MBTIAxes; value: number }) {
  const labels = AXIS_LABELS[axis];
  const leftActive = value < 50;
  const rightActive = value >= 50;
  return (
    <div className="mb-3">
      <div className="flex justify-between text-[10px] mb-1">
        <span className={leftActive ? "text-cyber-accent font-bold" : "text-gray-600"}>{labels.left}</span>
        <span className="text-gray-700 font-mono">{labels.letter}</span>
        <span className={rightActive ? "text-cyber-pink font-bold" : "text-gray-600"}>{labels.right}</span>
      </div>
      <div className="relative h-3 bg-cyber-dark rounded-full overflow-hidden">
        <div className="absolute top-0 left-1/2 w-px h-full bg-gray-700" />
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{
            width: `${value}%`,
            backgroundColor: rightActive ? "#ff00aa" : "#00f0ff",
          }}
        />
      </div>
    </div>
  );
}

function HourlyChart({ hourlyDistribution }: { hourlyDistribution: number[] }) {
  const maxVal = Math.max(...hourlyDistribution, 0.01);
  return (
    <div className="flex items-end gap-0.5 h-16">
      {hourlyDistribution.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center">
          <div
            className="w-full rounded-t transition-all duration-700"
            style={{
              height: `${(v / maxVal) * 100}%`,
              backgroundColor: v > 0.5 ? "#00f0ff" : v > 0.2 ? "#00f0ff80" : "#2a2a5a",
            }}
          />
          {i % 4 === 0 && <span className="text-[8px] text-gray-600 mt-0.5">{i}</span>}
        </div>
      ))}
    </div>
  );
}

function SizeChart({ dist }: { dist: PersonaReportType["transactionPattern"]["sizeDistribution"] }) {
  const total = dist.small + dist.medium + dist.large + dist.whale || 1;
  const items = [
    { label: "小額 <100", value: dist.small, color: "#2a2a5a" },
    { label: "中額 100-10k", value: dist.medium, color: "#00f0ff60" },
    { label: "大額 10k-100k", value: dist.large, color: "#00f0ff" },
    { label: "巨鯨 >100k", value: dist.whale, color: "#ff00aa" },
  ];
  return (
    <div className="space-y-2">
      {items.map(item => (
        <div key={item.label} className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 w-24 text-right">{item.label}</span>
          <div className="flex-1 h-3 bg-cyber-dark rounded overflow-hidden">
            <div className="h-full rounded transition-all duration-700" style={{ width: `${(item.value / total) * 100}%`, backgroundColor: item.color }} />
          </div>
          <span className="text-[10px] text-gray-400 w-10">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function PersonaReport({ report }: { report: PersonaReportType }) {
  const mbti = report.personality.mbti;
  const desc = MBTI_DESCRIPTIONS[mbti];
  const axes = report.personality.axes;
  const ts = report.trustScore;

  const trustColor = ts.score >= 800 ? "#00ff88" : ts.score >= 600 ? "#00f0ff" : ts.score >= 400 ? "#ffdd00" : ts.score >= 200 ? "#ff8800" : "#ff3355";
  const trustLabel = { very_high: "極高", high: "高", medium: "中", low: "低", very_low: "極低" }[ts.level] || ts.level;

  return (
    <div className="mt-8 space-y-6">
      {/* MBTI Header */}
      <div className="cyber-border rounded-lg p-6 bg-cyber-panel">
        <div className="flex items-center gap-4 mb-4">
          <MBTIBadge mbti={mbti} />
          <div className="ml-auto text-right">
            <div className="text-3xl font-bold" style={{ color: trustColor }}>{ts.score}</div>
            <div className="text-xs text-gray-500">信任分 / 1000</div>
          </div>
        </div>
        <p className="text-gray-300 text-sm leading-relaxed">{report.personality.summary}</p>
        {report.personality.secondaryArchetypes.length > 0 && (
          <div className="mt-3 flex gap-2 flex-wrap">
            <span className="text-xs text-gray-500">潛在性格:</span>
            {report.personality.secondaryArchetypes.map(a => {
              const sd = MBTI_DESCRIPTIONS[a];
              return (
                <span key={a} className="text-xs border border-cyber-border rounded px-2 py-0.5 text-gray-400">
                  {a} {sd.emoji} {sd.name}
                </span>
              );
            })}
          </div>
        )}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-cyber-dark rounded p-2">
            <div className="text-lg font-bold text-cyber-accent">{report.transactionPattern.totalTrades}</div>
            <div className="text-[10px] text-gray-500">交易次數</div>
          </div>
          <div className="bg-cyber-dark rounded p-2">
            <div className="text-lg font-bold text-cyber-green">${Math.round(report.transactionPattern.medianTradeSize).toLocaleString()}</div>
            <div className="text-[10px] text-gray-500">中位數交易</div>
          </div>
          <div className="bg-cyber-dark rounded p-2">
            <div className="text-lg font-bold text-cyber-yellow">{RHYTHM_LABEL[report.transactionPattern.activityRhythm] || report.transactionPattern.activityRhythm}</div>
            <div className="text-[10px] text-gray-500">作息節奏</div>
          </div>
          <div className="bg-cyber-dark rounded p-2">
            <div className="text-lg font-bold text-cyber-pink">{FLOW_LABEL[report.fundFlow.flowType] || report.fundFlow.flowType}</div>
            <div className="text-[10px] text-gray-500">資金流向</div>
          </div>
        </div>
      </div>

      {/* Two-column: MBTI Axes + Radar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* MBTI Axes */}
        <div className="cyber-border rounded-lg p-6 bg-cyber-panel">
          <h3 className="text-sm font-semibold text-gray-400 mb-4">🧬 MBTI 四維度</h3>
          <AxisBar axis="energy" value={axes.energy} />
          <AxisBar axis="risk" value={axes.risk} />
          <AxisBar axis="speed" value={axes.speed} />
          <AxisBar axis="social" value={axes.social} />
          <div className="mt-4 text-center">
            <span className="text-2xl font-bold text-cyber-accent font-mono tracking-widest">
              {mbti}
            </span>
            <p className="text-xs text-gray-600 mt-1">信心度: {report.personality.confidence}%</p>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="cyber-border rounded-lg p-6 bg-cyber-panel">
          <h3 className="text-sm font-semibold text-gray-400 mb-4">🎭 人格雷達圖</h3>
          <RadarChart radar={report.personality.radar} />
          <p className="text-center text-xs text-gray-600 mt-2">信心度: {report.personality.confidence}%</p>
        </div>
      </div>

      {/* Trust Score */}
      <div className="cyber-border rounded-lg p-6 bg-cyber-panel">
        <h3 className="text-sm font-semibold text-gray-400 mb-4">🛡️ 信任評分</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-5xl font-bold" style={{ color: trustColor }}>{ts.score}</div>
            <div className="text-sm text-gray-500">{trustLabel}風險</div>
            <div className="mt-2 h-3 rounded-full overflow-hidden trust-bar opacity-30">
              <div className="h-full bg-white/20" style={{ width: `${ts.score / 10}%` }} />
            </div>
          </div>
          <div className="md:col-span-2">
            <TrustBar value={ts.breakdown.authenticity} label="真實性 (vs 機器人)" color="#00f0ff" />
            <TrustBar value={ts.breakdown.financialHealth} label="財務健康" color="#00ff88" />
            <TrustBar value={ts.breakdown.reputation} label="鏈上信譽" color="#ffdd00" />
            <TrustBar value={ts.breakdown.consistency} label="行為一致性" color="#ff00aa" />
            <TrustBar value={ts.breakdown.riskExposure} label="風險曝露" color="#ff3355" />
          </div>
        </div>
      </div>

      {/* Transaction Pattern */}
      <div className="cyber-border rounded-lg p-6 bg-cyber-panel">
        <h3 className="text-sm font-semibold text-gray-400 mb-4">⏰ 交易模式分析</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-gray-500 mb-2">24小時交易分佈</p>
            <HourlyChart hourlyDistribution={report.transactionPattern.hourlyDistribution} />
            <p className="text-[10px] text-gray-600 mt-1 text-center">
              週末交易佔比: {(report.transactionPattern.weekendRatio * 100).toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-2">交易金額分佈</p>
            <SizeChart dist={report.transactionPattern.sizeDistribution} />
          </div>
        </div>
      </div>

      {/* Fund Flow */}
      <div className="cyber-border rounded-lg p-6 bg-cyber-panel">
        <h3 className="text-sm font-semibold text-gray-400 mb-4">💰 資金流向</h3>
        {report.fundFlow.exchangeFlow.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">交易所互動</p>
            <div className="space-y-2">
              {report.fundFlow.exchangeFlow.slice(0, 5).map((ex, i) => (
                <div key={i} className="flex items-center gap-3 text-xs">
                  <span className="text-gray-400 w-24 truncate">{ex.exchange}</span>
                  <span className="text-cyber-green">↓ ${Math.round(ex.deposited).toLocaleString()}</span>
                  <span className="text-cyber-pink">↑ ${Math.round(ex.withdrawn).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {report.fundFlow.defiInteractions.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-2">DeFi 協議</p>
            <div className="flex gap-2 flex-wrap">
              {report.fundFlow.defiInteractions.slice(0, 8).map((d, i) => (
                <span key={i} className="text-[10px] border border-cyber-border rounded px-2 py-1 text-gray-400">
                  {d.protocol} ({d.count}x)
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Evidence + Flags */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="cyber-border rounded-lg p-6 bg-cyber-panel">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">📝 證據</h3>
          <ul className="space-y-1">
            {report.personality.evidence.map((e, i) => (
              <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                <span className="text-cyber-accent mt-0.5">▸</span> {e}
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-6">
          {ts.redFlags.length > 0 && (
            <div className="border border-red-500/20 rounded-lg p-4 bg-red-500/5">
              <h3 className="text-sm font-semibold text-red-400 mb-2">🚩 Red Flags</h3>
              <ul className="space-y-1">
                {ts.redFlags.map((f, i) => (
                  <li key={i} className="text-xs text-red-300/80 flex items-start gap-2">
                    <span className="mt-0.5">⚠️</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {ts.greenFlags.length > 0 && (
            <div className="border border-green-500/20 rounded-lg p-4 bg-green-500/5">
              <h3 className="text-sm font-semibold text-green-400 mb-2">✅ Green Flags</h3>
              <ul className="space-y-1">
                {ts.greenFlags.map((f, i) => (
                  <li key={i} className="text-xs text-green-300/80 flex items-start gap-2">
                    <span className="mt-0.5">✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[10px] text-gray-700 pb-8">
        Generated at {new Date(report.generatedAt).toLocaleString()} · Chains: {report.chainsScanned.join(", ")} · Dominant: {report.dominantChain}
      </div>
    </div>
  );
}
