# fairway-caddie

飛距離の分散に着目した期待値ベースのクラブ推薦AIキャディ。

## 技術スタック
- TypeScript / React + D3.js（フロントエンド）
- Go（REST API、標準ライブラリのみ）
- Python（ML / 統計モデル、Phase 2）
- PostgreSQL + PostGIS（Phase 2、MVP はインメモリ）
- GCP Cloud Run

## ルール
- TypeScript: ~/.claude/rules/typescript.md 参照
- Go: ~/.claude/rules/go.md 参照
- Proto: ~/.claude/rules/proto.md 参照

## コマンド
```
make check      # FE + Go API 全チェック
make api-test   # Go API テスト
make api-run    # Go API サーバー起動 (port 8080)
make quality    # 品質ゲート
make test-e2e   # Playwright E2E テスト
```

## ディレクトリ構造
```
src/           # React コンポーネント・hooks・lib・types
api/           # Go API (cmd/server, internal/{handler,model,service,store,middleware})
public/        # 静的アセット
test/e2e/      # Playwright E2E テスト
docs/          # 品質チェックリスト等
```
