# fairway-caddie

飛距離の分散に着目した期待値ベースのクラブ推薦AIキャディ。

ラウンドデータを蓄積してクラブ別の飛距離分布・精度を可視化し、コース攻略のショット選択を確率的に最適化する。

## 技術スタック

- **フロントエンド**: TypeScript / React + D3.js
- **バックエンド**: Go (API, gRPC)
- **データ処理**: Python (ML / 統計モデル)
- **データベース**: PostgreSQL + PostGIS
- **インフラ**: GCP Cloud Run

## セットアップ

```bash
# 依存インストール
npm install

# 開発サーバー起動
npm run dev

# テスト
npm run test

# lint + typecheck + test + build
make check
```

## ライセンス

MIT
