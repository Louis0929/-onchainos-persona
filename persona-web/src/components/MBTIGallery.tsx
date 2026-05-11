import { MBTI_DESCRIPTIONS, AXIS_LABELS, type OnchainMBTI } from "../types";

const MBTI_KEYS = Object.keys(MBTI_DESCRIPTIONS) as OnchainMBTI[];

const AXIS_EXPLANATIONS = [
  { axis: "H/G", left: "Guardian 守勢", right: "Hunter 主動", desc: "進場方式" },
  { axis: "R/S", left: "Stabilizer 穩健", right: "Risker 高風險", desc: "風險偏好" },
  { axis: "F/P", left: "Patient 耐心", right: "Flash 閃電", desc: "決策速度" },
  { axis: "C/L", left: "Lone 獨行", right: "Crowd 群眾", desc: "社交模式" },
];

export default function MBTIGallery() {
  return (
    <div className="mt-8 space-y-6">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-lg font-bold text-cyber-accent mb-1">📖 鏈上 MBTI 圖鑑</h2>
        <p className="text-xs text-gray-500">16 種鏈上人格，你是哪一種？</p>
      </div>

      {/* Axis explanation */}
      <div className="cyber-border rounded-lg p-4 bg-cyber-panel">
        <h3 className="text-xs font-semibold text-gray-400 mb-3">🔬 四維度解析</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {AXIS_EXPLANATIONS.map(a => (
            <div key={a.axis} className="bg-cyber-dark rounded p-3 text-center">
              <div className="text-sm font-bold text-cyber-accent font-mono">{a.axis}</div>
              <div className="text-[10px] text-gray-500 mt-1">{a.desc}</div>
              <div className="flex justify-between text-[9px] text-gray-600 mt-2">
                <span>{a.left}</span>
                <span>←→</span>
                <span>{a.right}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 16 Types Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {MBTI_KEYS.map((mbti) => {
          const desc = MBTI_DESCRIPTIONS[mbti];
          return (
            <div
              key={mbti}
              className="cyber-border rounded-lg p-3 bg-cyber-panel hover:bg-cyber-panel/80 transition group cursor-default"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl group-hover:scale-110 transition-transform">{desc.emoji}</span>
                <div>
                  <div className="text-[10px] text-gray-600 font-mono tracking-wider">{mbti}</div>
                  <div className="text-sm font-bold text-cyber-accent">{desc.nameZh}</div>
                </div>
              </div>
              <div className="text-[10px] text-gray-500 leading-relaxed">{desc.desc}</div>
              <div className="mt-2 flex gap-1 flex-wrap">
                {mbti.split("").map((c, i) => (
                  <span key={i} className="text-[8px] bg-cyber-dark rounded px-1.5 py-0.5 text-gray-500 font-mono">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
