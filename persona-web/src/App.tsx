import { useState } from "react";
import PersonaReport from "./components/PersonaReport";
import type { PersonaReport as PersonaReportType } from "./types";

const API_BASE = "/api";

export default function App() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<PersonaReportType | null>(null);
  const [error, setError] = useState("");

  const analyze = async () => {
    if (!address.trim()) return;
    setLoading(true);
    setError("");
    setReport(null);

    try {
      const res = await fetch(`${API_BASE}/persona`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: address.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Analysis failed");
      }
      const data = await res.json();
      setReport(data.report);
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cyber-dark">
      {/* Header */}
      <header className="border-b border-cyber-border bg-cyber-panel/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧬</span>
            <h1 className="text-xl font-bold text-cyber-accent cyber-glow">
              OnChainOS Persona
            </h1>
            <span className="text-xs text-gray-500 border border-cyber-border rounded px-2 py-0.5">
              v0.1.0
            </span>
          </div>
          <span className="text-xs text-gray-600">鏈上身分畫像引擎</span>
        </div>
      </header>

      {/* Input */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="cyber-border rounded-lg p-6 bg-cyber-panel">
          <label className="block text-sm text-gray-400 mb-2">輸入錢包地址</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && analyze()}
              placeholder="0x... 或 bc1... 或 Solana 地址"
              className="flex-1 bg-cyber-dark border border-cyber-border rounded px-4 py-3 text-cyber-accent placeholder-gray-600 focus:outline-none focus:border-cyber-accent/50 font-mono text-sm"
            />
            <button
              onClick={analyze}
              disabled={loading || !address.trim()}
              className="bg-cyber-accent/10 border border-cyber-accent/50 text-cyber-accent px-6 py-3 rounded font-semibold hover:bg-cyber-accent/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span> 分析中...
                </span>
              ) : (
                "🔍 分析"
              )}
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            這個地址背後是什麼人？我們從交易模式、資金流向、行為特徵中找到答案。
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 p-4 border border-red-500/30 bg-red-500/5 rounded text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Report */}
        {report && <PersonaReport report={report} />}

        {/* Empty state */}
        {!report && !loading && !error && (
          <div className="mt-16 text-center text-gray-600">
            <div className="text-6xl mb-4">🎭</div>
            <p className="text-lg">輸入地址，揭開鏈上身分</p>
            <p className="text-sm mt-2">交易模式 · 資金流向 · 人格畫像 · 信任評分</p>
          </div>
        )}
      </div>
    </div>
  );
}
