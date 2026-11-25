# CP PAIR

合コンで遊ぶ、真顔のパーティーゲーム。各自が好きな企業理念（Corporate Philosophy）をひとつ選び、選んだ理念どうしの「こじつけ相性」で男女のペアを決めて発表する。

**https://cppair.is-syunsukekobashi.workers.dev/**

<p>
  <img src="docs/screenshots/07-participant-step2-pick.png" alt="理念選びの画面。お題「無人島にひとつだけ持っていくならどの企業理念？」と、企業名を伏せた理念のカード" width="300">
  <img src="docs/screenshots/12-participant-step3-result.png" alt="結果の画面。ペアの相手の名前、相手が選んだ理念と企業名、こじつけ相性度 100%、称号「実は非上場！表舞台 × 裏の実力者ギャップペア」" width="300">
</p>

## 遊び方

1. **お題を選ぶ** — ホストが「無人島にひとつだけ持っていくならどの企業理念？」のようなお題を選び、ルームを作る
2. **理念を選ぶ** — 参加者は QR コードから参加し、企業名を伏せた 100 社の理念からひとつ選ぶ。スマホを持たない人は、ホストの端末で登録して端末を回して選ぶ
3. **発表する** — ホストが登録完了を宣言すると、創業年・業界・非上場などの共通点をこじつけて相性度と称号を付け、男女のペアを発表する。結果の画面で企業名が明かされる

## 特長

- **iPhone の Safari 向け** — スマホの縦画面を前提にした画面
- **電波がなくても遊べる** — 一度オンラインで開いた端末は、ネットワークなしでも開いて最後まで遊べる。地下の店でも、ホストの端末だけで進められる
- **登録不要** — アカウントもアプリのインストールも要らない。データはその端末のブラウザの中だけに置く

## 開発

### 必要なもの

- Node.js 22.18 以上（`npm run verify` が `node` で TypeScript を直接実行するため）。手元と配信のビルドは Node.js 24 で動かしている

### はじめかた

```sh
npm install
npm run dev
```

- ホストの画面: http://localhost:5173/
- 開発パネル: http://localhost:5173/?dev 。画面の右下の `DEV` から、ホストと参加者の端末の切り替え、テスト用の 4 人の投入、データの消去ができる。1 台のブラウザで、複数の端末での遊び方を再現できる

### コマンド

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発用のサーバを起動する |
| `npm run build` | 型を検査し、`dist/` にビルドする |
| `npm run lint` | oxlint で検査する |
| `npm run verify` | 相性の計算が、元のモックと同じ結果を返すかを確かめる |
| `npm run test:e2e` | ビルドした版を Playwright で動かし、ホストの端末だけで結果まで進む流れと、オフラインでの開き直しを確かめる |

`test:e2e` を初めて動かす前に `npx playwright install chromium` でブラウザを入れる。

### 構成

```
src/
  game/      相性の計算（エンジン・お題・こじつけの条件）
  data/      企業理念 100 社のデータ
  store/     ルームの保存。RoomStore のインターフェースと、localStorage の実装
  screens/   ホストと参加者の画面、理念選び、結果
  ui/        共通の部品・記号・トースト
  styles/    デザインの値（tokens.css）と画面のスタイル
  dev/       ?dev の開発パネル
e2e/         Playwright のテスト
scripts/     計算の照合（verify-matching.ts）とスクリーンショットの撮影
docs/        デザインの値（design/）と全画面のスクリーンショット（screenshots/）
```

- 画面の経路は URL のハッシュ（`#/host/...`、`#/r/<ルーム ID>`）で分ける
- ルームのデータは `src/store/RoomStore.ts` のインターフェースを通して出し入れする。端末をまたいで同期する保存先に替えるときは、この実装を足して `src/store/index.ts` で差し替える
- オフライン: `vite-plugin-pwa`（Workbox）の Service Worker が、ビルドした全ファイルを最初の表示のあとに保存する。新しい版は、オンラインで開いたときに取得して入れ替わる

## 配信

Cloudflare Workers の静的アセット（Worker のスクリプトなし）で配信する。設定は `wrangler.jsonc`。ビルドとデプロイは Cloudflare Workers Builds が GitHub への push を受けて行う。ビルド構成はリポジトリではなく Cloudflare のダッシュボード（Workers & Pages → `cppair` → Settings → Build）が持つ。

| 欄 | 値 |
|------|------|
| ビルド コマンド | `npm run build` |
| デプロイ コマンド | `npm run deploy` |
| Preview コマンド | `npm run preview:branch` |
| プロダクション ブランチ | `main` |

**`deploy` と `preview:branch` はビルドしない。** ビルド コマンドが作った `dist/` を前提にする。手元で使うときは `npm run build` を先に実行する。

**3 欄は `npm run` を通す。** コマンドの実体を `package.json` に置き、リポジトリだけを読めば配信の手順が分かるようにするため。

`main` への push は本番に、それ以外のブランチは Preview になり、PR にプレビュー URL がコメントされる（[Workers Builds の設定](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)）。

## 背景

要件・決定・デザインの議論は [ksyunnnn/synsk.me#398](https://github.com/ksyunnnn/synsk.me/issues/398) にある。
