# OnChainOS Persona 🧬

**鏈上身分畫像引擎** — "這個地址背後是什麼人？"

OnChainOS Persona analyzes on-chain behavior using an **MBTI-inspired classification system** to build a comprehensive identity profile for any wallet address.

## On-Chain MBTI System

4 binary axes create **16 on-chain personality types**:

| Axis | Letters | Meaning |
|---|---|---|
| Energy Source | **H**unter / **G**uardian | 主動出擊 vs 守勢佈局 |
| Risk Appetite | **R**isker / **S**tabilizer | 高風險偏好 vs 低風險偏好 |
| Decision Speed | **F**lash / **P**atient | 閃電決策 vs 耐心持倉 |
| Social Mode | **C**rowd / **L**one | 群眾追隨 vs 獨行俠 |

### The 16 Types

| Type | Name | 中文 | Description |
|---|---|---|---|
| HRFC | 🎰 Degen Sniper | 賭徒狙擊手 | 主動、高風險、閃電、跟風 |
| HRFL | 🗡️ Lone Wolf | 獨行狼 | 主動、高風險、閃電、獨行 |
| HRPC | 🎲 High Roller | 豪賭客 | 主動、高風險、耐心、跟風 |
| HRPL | 🎭 Contrarian Whale | 逆勢巨鯨 | 主動、高風險、耐心、獨行 |
| HSFC | ⚡ Flash Trader | 閃電交易者 | 主動、穩健、閃電、跟風 |
| HSFL | 🔬 Alpha Scanner | 先鋒獵手 | 主動、穩健、閃電、獨行 |
| HSPC | 📈 Trend Rider | 趨勢騎士 | 主動、穩健、耐心、跟風 |
| HSPL | 🎯 Strategic Hunter | 策略獵人 | 主動、穩健、耐心、獨行 |
| GRFC | 🌪️ FOMO Chaser | FOMO 追逐者 | 守勢、高風險、閃電、跟風 |
| GRFL | 🦊 Shadow Fox | 暗影狐狸 | 守勢、高風險、閃電、獨行 |
| GRPC | 🐑 Herd Believer | 羊群信徒 | 守勢、高風險、耐心、跟風 |
| GRPL | 🐋 Sleeping Whale | 沉睡巨鯨 | 守勢、高風險、耐心、獨行 |
| GSFC | 🤖 Bot Farmer | 機器人農夫 | 守勢、穩健、閃電、跟風 |
| GSFL | 🕵️ Silent Operator | 無聲操盤手 | 守勢、穩健、閃電、獨行 |
| GSPC | 🤲 Diamond Hodler | 鑽石佛系手 | 守勢、穩健、耐心、跟風 |
| GSPL | 🏔️ Monk | 鏈上隱士 | 守勢、穩健、耐心、獨行 |

## 安裝教程

### 前置需求

1. **Node.js** >= 18
2. **OnChainOS CLI** — 鏈上數據的核心工具
3. **Claude Code** — AI Agent 層（可選，用於 `/persona` skill）

### Step 1: 安裝 OnChainOS CLI

#### macOS / Linux

```bash
# 下載最新版
curl -fsSL https://web3.okx.com/onchainos/install.sh | bash

# 或手動安裝到 ~/.local/bin/
mkdir -p ~/.local/bin
curl -fsSL -o ~/.local/bin/onchainos https://web3.okx.com/onchainos/latest/darwin-arm64/onchainos
chmod +x ~/.local/bin/onchainos

# 確認安裝
onchainos --help
```

#### Windows

```powershell
# 建立目錄
New-Item -ItemType Directory -Path "$env:USERPROFILE\.local\bin" -Force

# 下載 (PowerShell)
Invoke-WebRequest -Uri "https://web3.okx.com/onchainos/latest/windows-amd64/onchainos.exe" -OutFile "$env:USERPROFILE\.local\bin\onchainos.exe"

# 確認安裝
& "$env:USERPROFILE\.local\bin\onchainos.exe" --help
```

> 如果下載連結不可用，請從 OnChainOS 官方渠道獲取 CLI binary。

### Step 2: 克隆專案並安裝依賴

```bash
git clone https://github.com/Louis0929/-onchainos-persona.git
cd onchainos-persona

npm install
cd persona-web && npm install && cd ..
```

### Step 3: 配置 OnChainOS MCP Server

OnChainOS CLI 內建 MCP server mode，讓 Claude Code 能直接呼叫鏈上工具。

#### macOS / Linux

在家目錄建立 `~/.mcp.json`：

```json
{
  "mcpServers": {
    "onchainos": {
      "command": "/Users/<你的用戶名>/.local/bin/onchainos",
      "args": ["mcp"],
      "type": "stdio"
    }
  }
}
```

#### Windows

在家目錄建立 `%USERPROFILE%\.mcp.json`：

```json
{
  "mcpServers": {
    "onchainos": {
      "command": "C:\\Users\\<你的用戶名>\\.local\\bin\\onchainos.exe",
      "args": ["mcp"],
      "type": "stdio"
    }
  }
}
```

或在專案目錄下建立 `.mcp.json`（僅該專案生效）。

### Step 4: 安裝 Persona Skill

將 skill 複製到 Claude Code 的全域 skills 目錄：

#### macOS / Linux

```bash
mkdir -p ~/.claude/skills
cp .claude/skills/persona.md ~/.claude/skills/persona.md
```

#### Windows

```powershell
New-Item -ItemType Directory -Path "$env:USERPROFILE\.claude\skills" -Force
Copy-Item ".claude\skills\persona.md" "$env:USERPROFILE\.claude\skills\persona.md"
```

### Step 5: 使用

在 Claude Code 中輸入：

```
/persona 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
```

Claude 會自動：
1. 透過 OnChainOS MCP 取得鏈上數據（持倉、PnL、交易歷史）
2. 根據發現自主決定是否追加調查（聰明錢信號、安全掃描、排行榜）
3. 用 scoring pipeline 計算結構化 MBTI
4. 用 LLM 寫出最終人格報告（中文）

## API Server（獨立使用）

不需要 Claude Code 也能用：

```bash
# 啟動 API server
npm run dev:server

# 啟動 Web UI
npm run dev:web
```

| Endpoint | Description |
|---|---|
| `POST /api/persona` | Full persona report (MBTI + trust + patterns) |
| `POST /api/trust-score` | Trust score only (lightweight) |
| `POST /api/radar` | Radar chart data |
| `POST /api/similar` | Similar address recommendations |
| `GET /api/health` | Health check |

### CLI

```bash
# 基本分析
npm run dev -- 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045

# 指定鏈
npm run dev -- 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 ethereum base arbitrum

# Scoring pipeline only (JSON output)
npx tsx src/agent/scoring/cli.ts --address 0x... --chain ethereum
```

## Architecture

```
Claude Code (LLM + Agent Loop)
  ├── Skill: .claude/skills/persona.md（分析流程 prompt）
  ├── Tools: OnChainOS MCP（50+ 鏈上工具）
  │   ├── portfolio — 總值、持倉、PnL
  │   ├── signal — 聰明錢/鯨魚追蹤
  │   ├── tracker — 地址活動監控
  │   ├── security — 交易掃描、代幣風險
  │   ├── market — DEX 歷史、K線
  │   ├── memepump — Meme 幣分析、Rug 偵測
  │   ├── leaderboard — 排行榜
  │   └── workflow — 一鍵組合查詢
  └── Scoring Pipeline（結構化基礎）
      ├── 31 normalized signals
      ├── 4-axis weighted computation
      └── MBTI classification + confidence

API Server (port 3102)
  └── Express + scoring pipeline + OnChainOS CLI fallback

Web UI (port 5186)
  └── React + Vite + Tailwind CSS (cyberpunk theme)
```

## Environment Variables

```env
# OKX API (optional — OnChainOS CLI works without these)
OKX_API_KEY=
OKX_SECRET_KEY=
OKX_PASSPHRASE=
OKX_ACCESS_TOKEN=

# Custom OnChainOS CLI path (auto-detected by default)
ONCHAINOS_BIN=

# Server port (default: 3102)
PORT=3102

# Force mock mode (default: auto-detect)
MOCK_MODE=1
```

## License

MIT
