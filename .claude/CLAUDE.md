# fairway-caddie アーキテクチャ概要

## 設計概要

モノレポ構成。MVP Phase 0 はフロントエンド（React + D3.js）先行開発。
バックエンドは Phase 1 で Go API、Phase 2 で Python ML を統合。

## 主要な設計判断

| 判断 | 理由 | ADR |
|------|------|-----|
| フロントエンド先行MVP | 可視化がコアバリュー。バックエンドはモック可能 | TODO: ADR-001 |
| D3.js（not Chart.js） | コースマップ上のカスタム散布図が必要 | TODO: ADR-002 |
| ルールベース推薦（MVP） | ベイズ推定はデータ蓄積後。MVPは統計的閾値ベース | TODO: ADR-003 |

## データフロー

```
[ショット記録UI] -> [ローカルストレージ/モックAPI] -> [統計計算] -> [D3.js可視化]
                                                    -> [期待値計算] -> [クラブ推薦UI]
```

## 外部サービス連携

- **PostGIS**: 地理空間データ（コースレイアウト、ショット位置）
- **GCP Cloud Run**: デプロイ先（Phase 1以降）
- **コースデータ**: 入手方法は未定（未解決事項）

## 品質基準

- Layer-0: 共通品質チェックリスト（Makefile quality ターゲット）
- Layer-2: Web App 固有チェックリスト（docs/quality-override.md）
