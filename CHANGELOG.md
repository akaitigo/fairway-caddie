# Changelog

## v1.0.0 (2026-03-30)

MVP release -- 飛距離の分散に着目した期待値ベースのクラブ推薦AIキャディ。

### Features

- クラブ推薦ロジック: 飛距離分布 x ハザードリスクの期待値計算 (#15)
- 統計可視化: D3.js による飛距離分布グラフ + ショット散布図 (#14)
- ショット記録UI: コースマップ + クラブ選択 + ショット一覧 (#13)
- コアデータモデル設計: ショット・ラウンド・クラブ・コースの型定義とバリデーション (#12)
- プロジェクト基盤セットアップ: CI/CD, Vite, テストフレームワーク, リンター (#11)

### Technical Details

- TypeScript / React + D3.js フロントエンド
- 71 テスト全パス (validation: 20, statistics: 23, recommendation: 17, storage: 11)
- Biome (format/lint) + oxlint + tsc --noEmit による品質ゲート
- ADR-001 (フロントエンド先行MVP), ADR-002 (ルールベース推薦)
