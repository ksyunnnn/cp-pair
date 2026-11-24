# CP PAIR

合コン向けのパーティーゲーム。参加者が好きな企業理念（Corporate Philosophy）を選び、選んだ理念どうしのこじつけの相性で男女を組んで発表する。

要件・決定・デザインの議論は [ksyunnnn/synsk.me#398](https://github.com/ksyunnnn/synsk.me/issues/398) にある。

## ワークスペース

- `repository/main`: 本体
- `repository/desk-NN`: git worktree の常設ワークスペース。`desk-NN` ブランチにはコミットを積まず、作業は `feature/*` を checkout して行う

## 開発

```sh
npm install
npm run dev        # http://localhost:5173/
npm run build      # 型の検査と本番用のビルド
npm run verify     # 相性の計算がモックと同じ結果になるかを確かめる
```

- ホストの画面: `http://localhost:5173/`
- 開発パネル: URL に `?dev` を付ける（`http://localhost:5173/?dev`）。画面の右下の `DEV` から、ホストと参加者の端末の切り替え、テスト用の参加者の投入、データの消去ができる
- データはブラウザの localStorage に置く。出し入れは `src/store/RoomStore.ts` のインターフェースを通す
- デザインの値の出どころ: `docs/design/framer-values.md`
- 全画面のスクリーンショット: `docs/screenshots/`（撮り方は `scripts/screenshots.js` の先頭）
