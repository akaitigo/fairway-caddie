# fairway-caddie

飛距離の分散に着目した期待値ベースのクラブ推薦AIキャディ。

## 技術スタック
- TypeScript / React + D3.js（フロントエンド）
- Go（API層、gRPC）
- Python（ML / 統計モデル）
- PostgreSQL + PostGIS
- GCP Cloud Run

## ルール
- TypeScript: ~/.claude/rules/typescript.md 参照
- Proto: ~/.claude/rules/proto.md 参照

## コマンド
```
make check     # format → lint → typecheck → test → build
make quality   # 品質ゲート
make test-e2e  # Playwright E2E テスト
```

## ディレクトリ構造
```
src/           # React コンポーネント・hooks・lib・types
public/        # 静的アセット
test/e2e/      # Playwright E2E テスト
docs/          # 品質チェックリスト等
```
