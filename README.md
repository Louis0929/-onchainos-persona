# OnChainOS Persona 🧬

**鏈上身分畫像引擎** — "這個地址背後是什麼人？"

OnChainOS Persona analyzes on-chain behavior to build a comprehensive identity profile for any wallet address. It goes beyond balance tracking to answer: **who is this address?**

## Core Capabilities

| Capability | Description |
|---|---|
| 🕐 Transaction Pattern Analysis | Time distribution (night owl? bot?), frequency, size distribution |
| 💰 Fund Flow Mapping | Where money comes from, where it goes, who they interact with (exchanges, DeFi, bridges) |
| 🎭 Personality Portrait | Archetype classification: whale? degen? market maker? gambler? |
| 🛡️ Trust Score | Reusable 0-1000 score for ExChain, lending, KYC, due diligence |

## Architecture

```
onchainos-persona/
├── src/
│   ├── agent/
│   │   ├── persona-analyzer.ts   # Core analysis engine
│   │   ├── cli.ts                # CLI entry point
│   │   └── index.ts              # Exports
│   ├── server/
│   │   └── index.ts              # Express API server (port 3102)
│   ├── types/
│   │   ├── persona.ts            # Persona-specific types
│   │   └── onchainos.ts          # On-chain data types
│   └── utils/
│       └── onchainos.ts          # OKX API integration
└── persona-web/                  # React + Vite + Tailwind UI (port 5186)
```

## API Endpoints

| Endpoint | Description |
|---|---|
| `POST /api/persona` | Full persona report |
| `POST /api/trust-score` | Trust score only (lightweight, for integration) |
| `POST /api/radar` | Radar chart data (for UI visualization) |
| `GET /api/health` | Health check |

## Quick Start

```bash
# Install
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

## ExChain Integration

ExChain can call `/api/trust-score` to enrich breakup reports with persona data:

```
POST /api/trust-score
{ "address": "0x..." }

→ { "trustScore": {...}, "archetype": "degen", "confidence": 75 }
```

## Persona Archetypes

| Archetype | Label | Pattern |
|---|---|---|
| 🐋 whale | 大鯨魚 | High value, low frequency |
| 🎰 degen | Degen | High risk, meme-heavy |
| 💎 diamond_hands | 鑽石手 | Long hold, profitable |
| 🧻 paper_hands | 紙手 | Quick panic sell |
| 🏭 market_maker | 做市商 | High frequency, small spread |
| 🎲 gambler | 賭徒 | All-in on meme/rug |
| 🌾 farmer | 農夫 | DeFi yield farming |
| 👨‍💻 project_dev | 項目方 | Contract deploys, team wallets |
| 🛒 retail | 散戶 | Small amounts, trend-following |
| 🌀 launderer | 洗錢嫌疑 | Rapid cross-chain, fragmented |
| 🤲 hodler | 佛系持幣 | Very low activity |
| 🌉 bridge_hopper | 跨鏈玩家 | Frequent bridging |

## License

MIT
