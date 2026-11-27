# Framer の写し

Framer プロジェクト xdh5lhXEtr2QsuFohBhR の main を、2026-11-27 に読み取り専用で書き出した写し。Framer の試用が切れても元のデザインを参照できるように置いている。Framer 側は何も変えていない。

## 作り方

Framer MCP の `exec` で次を呼んだ。

- `api.tree.serialize(id, { depth: 50 })` でノードを JSON にした
- スタイルは `ColorStyleTokenNode` / `TextStylePresetNode` / `LinkStylePresetNode` をまとめて書き出した
- `api.tree.screenshot(id)` で画像を撮り、返った URL から取得した（Framer の返す形式が JPEG なので `.jpg`）

JSON は 2 スペースでインデントし直しただけで、中身は書き出したままにしている。色やテキストスタイルは `var(--token-…)` や preset id で参照されるので、`styles.json` の id と突き合わせて読む。

## ファイルと Framer ノード

| ファイル | Framer ノード名 | id |
| --- | --- | --- |
| `page-result.json` | CP PAIR — あなたの結果（WebPage） | augiA20Il |
| `design-page-parts-sheet.json` | CP PAIR — 部品シート（DesignPage） | j_C4BQ0FH |
| `components/oMAZq6Ik4.json` | CP 主ボタン | oMAZq6Ik4 |
| `components/Vgo82sLqu.json` | CP 副ボタン | Vgo82sLqu |
| `components/PEwhoSoyL.json` | CP 文字リンクボタン | PEwhoSoyL |
| `components/wUp4OxnQq.json` | CP ニックネーム入力 | wUp4OxnQq |
| `components/J4wJ6rpFp.json` | CP 性別選択 | J4wJ6rpFp |
| `components/XPe_N9uRH.json` | CP 選択肢カード | XPe_N9uRH |
| `components/hogHJEghq.json` | CP バッジ | hogHJEghq |
| `components/DkHwa6fLy.json` | CP 参加者の行 | DkHwa6fLy |
| `components/p_6G2PpCJ.json` | CP 進行ステップ | p_6G2PpCJ |
| `components/cFuw2JrcM.json` | CP フローティング操作バー | cFuw2JrcM |
| `vector-set-symbols.json` | CP PAIR Symbols（VectorSet） | qVkSETKBD |
| `styles.json` | 色トークン 6 個・テキストスタイル 6 個・リンクスタイル 1 個 | — |

`screenshots/` の画像は `<id>.jpg` がノード全体、`<コンポーネントid>-<バリアント名のローマ字>.jpg` が各バリアント。

| 画像 | 中身 |
| --- | --- |
| `augiA20Il.jpg` | 結果ページ全体 |
| `j_C4BQ0FH-Hpceai3sm.jpg` | 部品シートの最上位フレーム「CP PAIR · Interface Kit」。上端 200px ほどしか写らない |
| `oMAZq6Ik4-oseru.jpg` / `-osenai.jpg` | CP 主ボタン 押せる / 押せない |
| `Vgo82sLqu-oseru.jpg` / `-osenai.jpg` | CP 副ボタン 押せる / 押せない |
| `PEwhoSoyL-oseru.jpg` / `-osenai.jpg` | CP 文字リンクボタン 押せる / 押せない |
| `wUp4OxnQq-kara.jpg` / `-nyuryoku-ari.jpg` | CP ニックネーム入力 空 / 入力あり |
| `J4wJ6rpFp-dansei.jpg` / `-josei.jpg` | CP 性別選択 男性 / 女性 |
| `XPe_N9uRH-tsujo.jpg` / `-sentaku-zumi.jpg` | CP 選択肢カード 通常 / 選択済み |
| `DkHwa6fLy-erabi-oeta.jpg` / `-mada.jpg` | CP 参加者の行 選び終えた / まだ |
| `p_6G2PpCJ-1-odai.jpg` / `-2-sanka-sentaku.jpg` / `-3-kekka.jpg` | CP 進行ステップ 1 お題 / 2 参加・選択 / 3 結果 |
| その他の `<id>.jpg` | 各コンポーネントの既定の見た目 |

## 入っていないもの

- ジェスチャーのバリアント（主ボタン・副ボタン・文字リンクボタンの Pressed）の画像。Framer の screenshot はジェスチャー状態を撮れない。中身は各コンポーネントの JSON にある
- 部品シート全体の画像。デザインページはまとめて撮れず、最上位フレームも上端しか写らず、各セクションを撮ると白紙になった
- 結果ページのアイコン（`set: "omX0gWFPqDwhaiWwf6ab"`）など ExternalModuleNode の中身。外部モジュールなので参照 id だけが残っている
