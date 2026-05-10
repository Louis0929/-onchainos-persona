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

| Type | Name | Description |
|---|---|---|
| HRFC | 🎰 Degen Sniper | 主動出擊、高風險、閃電決策、跟風 |
| HRFL | 🗡️ Lone Wolf | 主動出擊、高風險、閃電決策、獨行 |
| HRPC | 🎲 High Roller | 主動出擊、高風險、耐心持倉、跟風 |
| HRPL | 🎭 Contrarian Whale | 主動出擊、高風險、耐心持倉、獨行 |
| HSFC | ⚡ Flash Trader | 主動出擊、穩健選幣、閃電決策、跟風 |
| HSFL | 🔬 Alpha Scanner | 主動出擊、穩健選幣、閃電決策、獨行 |
| HSPC | 📈 Trend Rider | 主動出擊、穩健選幣、耐心持倉、跟風 |
| HSPL | 🎯 Strategic Hunter | 主動出擊、穩健選幣、耐心持倉、獨行 |
| GRFC | 🌪️ FOMO Chaser | 守勢佈局、高風險、閃電決策、跟風 |
| GRFL | 🦊 Shadow Fox | 守勢佈局、高風險、閃電決策、獨行 |
| GRPC | 🐑 Herd Believer | 守勢佈局、高風險、耐心持倉、跟風 |
| GRPL | 🐋 Sleeping Whale | 守勢佈局、高風險、耐心持倉、獨行 |
| GSFC | 🤖 Bot Farmer | 守勢佈局、穩健選幣、閃電決策、跟風 |
| GSFL | 🕵️ Silent Operator | 守勢佈局、穩健選幣、閃電決策、獨行 |
| GSPC | 🤲 Diamond Hodler | 守勢佈局、穩健選幣、耐心持倉、跟風 |
| GSPL | 🏔️ Monk | 守勢佈局、穩健選幣、耐心持倉、獨行 |

## Core Capabilities

| Capability | Description |
|---|---|
| 🕐 Transaction Pattern Analysis | Time distribution (night owl? bot?), frequency, size distribution |
| 💰 Fund Flow Mapping | Where money comes from, where it goes, who they interact with |
| 🧬 On-Chain MBTI | 16-type personality classification with 4-axis scores |
| 🛡️ Trust Score | Reusable 0-1000 score for lending, KYC, due diligence |

## Architecture

```
onchainos-persona/
├── src/
│   ├── agent/
│   │   ├── persona-analyzer.ts   # Core analysis engine (MBTI + trust)
│   │   ├── cli.ts                # CLI entry point
│   │   └── index.ts              # Exports
│   ├── server/
│   │   └── index.ts              # Express API server (port 3102)
│   ├── types/
│   │   ├── persona.ts            # MBTI types + all persona types
│   │   └── onchainos.ts          # On-chain data types
│   └── utils/
│       └── onchainos.ts          # OKX API integration
└── persona-web/                  # React + Vite + Tailwind UI (port 5186)
```

## API Endpoints

| Endpoint | Description |
|---|---|
| `POST /api/persona` | Full persona report (MBTI + trust + patterns) |
| `POST /api/trust-score` | Trust score only (lightweight) |
| `POST /api/radar` | Radar chart data |
| `GET /api/health` | Health check |

## Quick Start

```bash
npm install
cd persona-web && npm install && cd ..

# Run API server
npm run dev:server

# Run web UI
npm run dev:web

# CLI
npm run dev -- 0x... ethereum base
```

## Environment Variables

```env
OKX_API_KEY=       # OKX DEX API key
OKX_SECRET_KEY=    # OKX DEX secret key
OKX_PASSPHRASE=    # OKX DEX passphrase
OKX_ACCESS_TOKEN=  # OR use OAuth token instead
ONCHAINOS_BIN=     # Path to onchainos CLI (fallback)
```

## License

MIT
