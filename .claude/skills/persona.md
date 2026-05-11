# OnChainOS Persona — 鏈上身分畫像分析 Skill

分析鏈上地址的人格特質，回答核心問題：**這個地址背後是什麼人？**

## 觸發

- 用戶輸入 `/persona` + 地址
- 用戶要求分析某個錢包地址的人格、交易行為、信任評分
- 用戶問「這個地址是什麼人？」「分析一下 0x...」

## 判斷地址類型

先判斷地址格式決定用哪條鏈：
- `0x` 開頭 42 字元 → EVM 地址，預設查 ethereum
- `bc1` 或 `1`/`3` 開頭 → Bitcoin，僅查總值，不跑完整分析
- 44 字元 base58 → Solana 地址，查 solana

## 分析流程

### Phase 1: 快速全貌（必做，2 次工具呼叫）

並行呼叫：

1. **`workflow_wallet_analysis`** — 一次取得錢包全貌
   - 參數: `address`, `chain_index: "1"` (ethereum)
   - 回傳: 7d/30d PnL、交易統計、近期活動

2. **`portfolio_total_value`** — 總持倉價值
   - 參數: `address`, `chains: "1,8453,42161"` (ethereum+base+arbitrum)

根據 Phase 1 結果做**動態判斷**：

| 發現 | 行動 |
|---|---|
| tradeCount < 5 on ethereum | → 嘗試 base (8453), arbitrum (42161), bsc (56) |
| totalValue < $100 | → 標記「小額地址」，降低分析深度 |
| totalValue > $1M | → 標記「巨鯨」，加強信號交叉 |
| 有大量 meme 幣 | → 觸發 Phase 4 安全檢查 |
| 勝率 > 60% | → 觸發 Phase 3 信號交叉 |
| 交易 24hr 均勻分佈 | → 標記「疑似機器人」 |

### Phase 2: 交易與 PnL 深挖（必做）

按順序呼叫（後面依賴前面）：

1. **`market_portfolio_overview`** — PnL 總覽
   - 參數: `address`, `chain_index`, `time_frame: "4"` (1年)
   - 關注: winRate, realizedPnlUsd, buyTxCount, sellTxCount

2. **`market_portfolio_dex_history`** — DEX 交易歷史
   - 參數: `address`, `chain_index`
   - 分析:
     - **時間模式**: 統計每小時交易量（night owl vs early bird vs machine）
     - **金額分佈**: small(<$100) / medium($100-10k) / large($10k-100k) / whale(>$100k)
     - **Meme 比例**: 代幣名稱匹配 doge/pepe/shib/floki/bonk/meme/trump
     - **持倉時間**: 買入到賣出的間隔

3. **`market_portfolio_recent_pnl`** — 近期逐幣 PnL
   - 參數: `address`, `chain_index`
   - 關注: 哪些幣盈利、哪些虧損、meme vs blue chip PnL 對比

**如果主鏈數據不足**（tradeCount < 5），用 `market_portfolio_supported_chains` 確認支援鏈，逐一嘗試 base → arbitrum → bsc → polygon。找到 tradeCount 最高的鏈作為 effective dominant chain。

### Phase 3: 信號交叉（條件觸發）

**觸發條件**: 勝率 > 55% 或 totalValue > $500k

1. **`signal_list`** — 聰明錢/鯨魚信號
   - 參數: `chain_index`, `limit: 10`
   - 用途: 查看近期聰明錢在買什麼，對比目標地址是否跟單

2. **`leaderboard_list`** — 排行榜
   - 參數: `chain_index`, `sort_type: "1"` (PnL), `limit: 5`
   - 用途: 查看目標地址是否接近 top trader 水平

3. **`token_top_trader`** — 對目標地址持有的主要代幣查 top trader
   - 參數: `token_contract_address`, `chain_index`
   - 用途: 看同一代幣的獲利者有哪些地址，判斷目標地址是否屬於「聰明錢圈」

### Phase 4: 安全與風險（條件觸發）

**觸發條件**: meme 幣佔比 > 30% 或 單一代幣佔總值 > 50%

1. **`token_advanced_info`** — 代幣風險等級
   - 參數: `token_contract_address`, `chain_index`
   - 關注: risk_level, creator 資訊, holder concentration

2. **`memepump_token_details`** — Meme 幣背景
   - 參數: `token_contract_address`, `chain_index`
   - 關注: 是否有 rug pull 風險、dev 聲譽

3. **`memepump_token_dev_info`** — 開發者背景
   - 參數: `token_contract_address`, `chain_index`
   - 關注: dev 是否有過 rug 歷史

4. **`token_cluster_overview`** — 持倉集中度
   - 參數: `token_contract_address`, `chain_index`
   - 關注: cluster_level, rug_pull_percent

5. **`tracker_activities`** — 地址活動追蹤（如發現可疑行為）
   - 參數: `address`, `tracker_type: "1"` (smart_money)
   - 用途: 查看地址是否被標記為聰明錢

### Phase 5: 結構化評分（必做）

用 scoring pipeline 計算結構化 MBTI：

```bash
cd "C:\Users\Louis Yeung\Desktop\onchainos-persona" && npx tsx src/agent/scoring/cli.ts --address 0x... --chain ethereum
```

輸出 JSON 包含: mbti, axes, confidence, evidence, radar, trustScore, fundFlowType

**注意**: scoring pipeline 可能因為 API 數據不完整而 confidence 偏低。這正常 — 你的 LLM 解讀可以補充。

### Phase 6: 最終人格解讀（必做，LLM 層）

基於 Phase 1-5 的所有數據，寫出人格報告。**這是你作為 Agent 最核心的價值** — 不是重複數字，而是講出這個地址的「故事」。

**人格敘述寫作要點**：
- 用具體行為舉例，不要只說「高風險偏好」，要說「這個地址 80% 的資金押在 PEPE 和 DOGE，虧損超過 $50k 但仍在加倉」
- 交叉引用不同數據源：「PnL 顯示勝率 62%，但進一步分析發現盈利集中在 3 筆 ETH 交易，其餘 meme 幣全部虧損」
- 動態追加的發現要寫進去：「安全掃描發現其持有的 TRUMP 代幣 dev 有過 2 次 rug pull 歷史」
- 如果 scoring pipeline 的 MBTI 與你判斷不符，可以給出你的判斷並解釋差異

**輸出格式**：

```markdown
## 🧬 鏈上人格報告

**地址**: `0x...`
**MBTI**: HRFC 🎰 賭徒狙擊手
**信任分**: 750/1000 (高)
**主鏈**: ethereum | 總值: $XXX | 勝率: XX%

### 四維度分析

| 維度 | 分數 | 方向 | 解讀 |
|---|---|---|---|
| H/G 能量來源 | 72 | Hunter 主動 | （你的解讀）|
| R/S 風險偏好 | 65 | Risker 高風險 | （你的解讀）|
| F/P 決策速度 | 80 | Flash 閃電 | （你的解讀）|
| C/L 社交模式 | 55 | Crowd 群眾 | （你的解讀）|

### 人格敘述

（3-5 句話的中文人格描述。結合數據講故事，不是重複數字。）

### 關鍵證據

（最重要的 5-8 條，從 scoring evidence 和你自己發現的洞察中挑選）

### 風險提示

（如果有：高風險代幣、rug pull 歷史、可疑行為等）

### 與已知地址比較

（如果 memory 中有之前分析過的地址，做橫向比較）
```

### Phase 7: 記憶儲存（必做）

分析完成後，存入 memory 供未來橫向比較：

```
檔案路徑: C:\Users\Louis Yeung\.claude\projects\C--Users-Louis-Yeung-Desktop-claude\memory\persona_<地址前8碼>.md

---
name: Persona <地址前8碼>
description: 鏈上人格: <MBTI> <中文名> | 信任分 <分數> | <主鏈>
type: project
---

- 地址: 0x...
- MBTI: HRFC 🎰 賭徒狙擊手
- 信任分: 750/1000 (高)
- 主鏈: ethereum
- 總值: $XXX
- 勝率: XX%
- PnL: +$XXX / -$XXX
- 關鍵特徵: （2-3 句話摘要）
- 分析日期: 2026-XX-XX
```

同時在 `MEMORY.md` 加入索引：
```
- [Persona 0xd8dA](persona_0xd8dA6BF.md) — HRFC 賭徒狙擊手 | 信任分 750 | ethereum
```

## 決策樹速查

```
用戶提供地址
  ├─ 類型判斷 → EVM/Solana/Bitcoin
  ├─ Phase 1: workflow_wallet_analysis + portfolio_total_value
  │   ├─ tradeCount < 5 → 換鏈重試
  │   ├─ totalValue < $100 → 淺度分析
  │   ├─ totalValue > $1M → 加強信號交叉
  │   └─ 大量 meme → 觸發安全檢查
  ├─ Phase 2: PnL overview + DEX history + recent PnL
  ├─ Phase 3: (條件) signal_list + leaderboard + token_top_trader
  ├─ Phase 4: (條件) token_advanced_info + memepump + cluster + tracker
  ├─ Phase 5: scoring pipeline CLI
  ├─ Phase 6: LLM 最終解讀
  └─ Phase 7: 存入 memory
```

## 工具對照表

| 分析需求 | MCP 工具 | 關鍵參數 |
|---|---|---|
| 錢包全貌 | `workflow_wallet_analysis` | address, chain_index |
| 總持倉價值 | `portfolio_total_value` | address, chains |
| 所有代幣持倉 | `portfolio_all_balances` | address, chains |
| PnL 總覽 | `market_portfolio_overview` | address, chain_index, time_frame |
| DEX 交易歷史 | `market_portfolio_dex_history` | address, chain_index |
| 逐幣 PnL | `market_portfolio_recent_pnl` | address, chain_index |
| 單幣 PnL | `market_portfolio_token_pnl` | address, chain_index, token |
| 聰明錢信號 | `signal_list` | chain_index, limit |
| 排行榜 | `leaderboard_list` | chain_index, sort_type |
| 代幣風險 | `token_advanced_info` | token_contract_address, chain_index |
| Meme 幣詳情 | `memepump_token_details` | token_contract_address, chain_index |
| Dev 背景 | `memepump_token_dev_info` | token_contract_address, chain_index |
| 持倉集中度 | `token_cluster_overview` | token_contract_address, chain_index |
| 地址追蹤 | `tracker_activities` | address, tracker_type |
| Top Trader | `token_top_trader` | token_contract_address, chain_index |
| 支援鏈列表 | `market_portfolio_supported_chains` | (無) |

## 鏈 Index 對照

| 鏈名 | chain_index |
|---|---|
| ethereum | 1 |
| base | 8453 |
| arbitrum | 42161 |
| bsc | 56 |
| polygon | 137 |
| optimism | 10 |
| avalanche | 43114 |
| solana | 501 |
| sui | 1001 |

## MBTI 類型參考

| 類型 | Emoji | 中文名 | 特徵 |
|---|---|---|---|
| HRFC | 🎰 | 賭徒狙擊手 | 主動、高風險、閃電、跟風 |
| HRFL | 🗡️ | 獨行狼 | 主動、高風險、閃電、獨行 |
| HRPC | 🎲 | 豪賭客 | 主動、高風險、耐心、跟風 |
| HRPL | 🎭 | 逆勢巨鯨 | 主動、高風險、耐心、獨行 |
| HSFC | ⚡ | 閃電交易者 | 主動、穩健、閃電、跟風 |
| HSFL | 🔬 | 先鋒獵手 | 主動、穩健、閃電、獨行 |
| HSPC | 📈 | 趨勢騎士 | 主動、穩健、耐心、跟風 |
| HSPL | 🎯 | 策略獵人 | 主動、穩健、耐心、獨行 |
| GRFC | 🌪️ | FOMO 追逐者 | 守勢、高風險、閃電、跟風 |
| GRFL | 🦊 | 暗影狐狸 | 守勢、高風險、閃電、獨行 |
| GRPC | 🐑 | 羊群信徒 | 守勢、高風險、耐心、跟風 |
| GRPL | 🐋 | 沉睡巨鯨 | 守勢、高風險、耐心、獨行 |
| GSFC | 🤖 | 機器人農夫 | 守勢、穩健、閃電、跟風 |
| GSFL | 🕵️ | 無聲操盤手 | 守勢、穩健、閃電、獨行 |
| GSPC | 🤲 | 鑽石佛系手 | 守勢、穩健、耐心、跟風 |
| GSPL | 🏔️ | 鏈上隱士 | 守勢、穩健、耐心、獨行 |

## 原則

1. **數據驅動** — 判斷有數據支撐，不憑空猜測
2. **動態深度** — 根據發現自主決定查多深
3. **中文優先** — 輸出用中文，術語可保留英文
4. **記憶橫比** — 回想之前分析過的地址做比較
5. **保持客觀** — 不美化不妖魔化
6. **保護隱私** — 只分析用戶主動提供的地址
7. **效率優先** — 用 workflow_* 工具減少工具呼叫次數，不要重複查相同數據
