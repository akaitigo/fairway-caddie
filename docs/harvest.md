# Harvest Report: fairway-caddie

**生成日**: 2026-03-30 | **アイデアID**: 482 | **ドメイン**: ゴルフ

---

## プロジェクト概要

飛距離の分散に着目した期待値ベースのクラブ推薦AIキャディ。
アマチュアゴルファーのショットデータを蓄積し、クラブ別飛距離分布とハザードリスクを可視化。
ミスショット込みの期待値でクラブ選択を最適化する React + D3.js SPA。

- **技術スタック**: TypeScript / React + D3.js, Vite, Biome, oxlint, Vitest, Playwright
- **フェーズ**: MVP Phase 0（フロントエンド先行）完了
- **リリース**: v1.0.0

## メトリクス

| 指標 | 値 |
|------|-----|
| Issue 総数 | 5（全 CLOSED） |
| PR 総数 | 10（5 MERGED, 5 OPEN — Dependabot） |
| ADR 数 | 2 |
| コミット数（非マージ） | 7 |
| テスト数 | 71（4ファイル, 全パス） |
| テストカバレッジ領域 | storage, statistics, recommendation, validation |
| ビルドサイズ | 274.68 KB (gzip: 87.68 KB) |
| CLAUDE.md 行数 | 29（上限50以内） |
| PRD 未解決事項 | 0（全4項目解決済み） |
| Dependabot PR（未マージ） | 5 |

## ハーネス適用状況

### Layer-0: 共通基盤

| 項目 | 適用 | 備考 |
|------|------|------|
| CLAUDE.md | YES | 29行。スタック・ルール・コマンド・ディレクトリ構造を記載 |
| .claude/CLAUDE.md（アーキテクチャ） | YES | 設計概要・データフロー・品質基準を記載 |
| PRD.md | YES | 問題定義・成功指標・技術要件・競合分析・マイルストーン完備 |
| ADR | YES | 2件（frontend-first-mvp, rule-based-recommendation） |
| Makefile (check / quality) | YES | format → lint → typecheck → test → build + quality gate |
| LICENSE | YES | 存在確認済み |
| CI/CD (.github/workflows/ci.yml) | YES | push/PR on main, Node 22, format → lint → typecheck → test → build |
| Dependabot | YES | dependabot-auto-merge.yml あり |
| settings.json（フック） | YES | PreToolUse（ファイルガード・破壊的コマンドブロック）, PostToolUse（post-lint）, PreCompact（バックアップ）, Stop（make check + E2E） |
| startup.sh | YES | ツール自動インストール・ヘルスチェック・dev サーバー起動 |
| lefthook.yml | YES | pre-commit: lint + format + test + archgate |
| post-lint.sh | YES | PostToolUse で自動実行 |

### Layer-1: 言語別（TypeScript）

| 項目 | 適用 | 備考 |
|------|------|------|
| Biome（formatter + linter） | YES | biome format --write + biome check |
| oxlint | YES | 97 rules, 0 warnings, 0 errors |
| TypeScript strict mode (tsc --noEmit) | YES | typecheck ステップあり |
| Vitest | YES | 71テスト全パス |
| `any` 禁止ルール参照 | YES | CLAUDE.md から ~/.claude/rules/typescript.md を参照 |

### Layer-2: アプリ種別（Web App）

| 項目 | 適用 | 備考 |
|------|------|------|
| quality-override.md | YES | a11y, パフォーマンス, SEO, セキュリティ, E2E, VRT, i18n, レスポンシブのチェックリスト |
| Playwright E2E | 部分 | config は Stop フックで参照。テスト自体は未実装（playwright.config.ts 不在時スキップ） |
| バンドルサイズ監視 | NO | ビルド時に表示されるが、閾値チェックなし |
| Lighthouse CI | NO | 未導入 |

## テンプレート改善提案

| # | カテゴリ | 提案 | 理由 | 優先度 |
|---|----------|------|------|--------|
| 1 | Layer-0 | idea-launch テンプレートに `playwright.config.ts` の初期生成を追加 | Stop フックが E2E を参照するが、scaffold 時点でファイルが存在しないためスキップされる。最初から空の config を置けば E2E を忘れない | 高 |
| 2 | Layer-0 | Dependabot PR の自動マージ条件を明文化（CLAUDE.md or ADR） | 5件の Dependabot PR が OPEN のまま放置。auto-merge workflow があるが実際にはマージされていない | 高 |
| 3 | Layer-1 | Vitest カバレッジ閾値を `make quality` に追加 | テスト71件は良好だが、カバレッジ率の定量的な品質ゲートがない。`--coverage --threshold 80` 等 | 中 |
| 4 | Layer-2 | バンドルサイズ上限チェックを CI に追加 | 274KB は許容範囲だが、成長を検知する仕組みがない。`bundlesize` or Vite の `build.reportCompressedSize` + 閾値 | 中 |
| 5 | Layer-2 | Lighthouse CI を GitHub Actions に追加 | quality-override.md で Performance 90+ を要求しているが、自動計測がない | 中 |
| 6 | Layer-0 | Issue ラベルに `status:in-progress` / `status:done` を追加し、自動遷移させる | 全 Issue が `status:backlog` のまま CLOSED。ステータスの可視性が低い | 低 |
| 7 | Layer-0 | startup.sh に Node.js バージョンチェックを追加 | CI は Node 22 を指定しているが、ローカル環境のバージョン不一致を検出できない | 低 |

## 振り返り

### 良かった点

1. **Issue-driven 開発の徹底**: 5 Issue → 5 PR → 5 MERGED。1:1 対応で追跡性が高い
2. **ハーネス適用率が高い**: Layer-0 の全項目を適用。settings.json のフック設計（PreToolUse/PostToolUse/Stop）が充実
3. **品質ゲートの多層防御**: lefthook（pre-commit）→ CI（GitHub Actions）→ Stop フック（make check + quality）の3段構え
4. **CLAUDE.md の簡潔さ**: 29行で50行制限を余裕でクリア。ポインタ方式（ルールファイル参照）が有効
5. **ADR による意思決定の記録**: フロントエンド先行戦略とルールベース推薦の根拠が文書化されている
6. **テスト設計**: storage / statistics / recommendation / validation の4領域で71テスト。コアロジックの網羅性が高い
7. **PRD の完成度**: 競合分析・技術リスク・マイルストーンまで記載。未解決事項も全て解決済み

### 改善点

1. **E2E テストが未実装**: Stop フックで Playwright を参照するが、playwright.config.ts が存在しないためスキップされる。scaffold 時点で最低限の E2E を生成すべき
2. **Dependabot PR の滞留**: 5件の dependency update PR が OPEN のまま。auto-merge workflow の設定を見直すか、手動でトリアージする運用が必要
3. **Issue ラベル運用が形骸化**: 全 Issue が `status:backlog` のまま CLOSED。進行中→完了のステータス遷移が反映されていない
4. **カバレッジの定量管理がない**: テスト数は十分だが、カバレッジ率の閾値が設定されていない。品質ゲートに組み込むべき
5. **バンドルサイズ・Lighthouse の自動監視がない**: quality-override.md で要求している基準の自動検証が未実装
