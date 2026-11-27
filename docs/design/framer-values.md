# Framer から取り出した値

出どころ: Framer プロジェクト `xdh5lhXEtr2QsuFohBhR`（Expansive Goals）の main ブランチ。2026-11-25 に Framer MCP の `exec`（`tree.serialize`・`tree.toSVG`・`tree.screenshot`）で読んだ。Framer は編集していない。

実装での使い先は `src/styles/`（入口は `index.css`。色の値と用途は `tokens.css`、部品は `components/`、画面は `result.css` などのファイル）と `src/ui/symbols.tsx`。`tokens.css` では、Framer の色トークンを値の名前（`--palette-*`）で置き、部品はそれを指す用途の名前（`--surface`・`--text` など）だけを使う。

## 目次

- 色トークン
- 文字スタイル
- 結果画面（ページ「CP PAIR — あなたの結果」、ブレイクポイント `WQLkyLRf1`）
- 部品（ComponentNode 10 個）
- 記号とロゴ
- アイコン（Phosphor）
- 部品シートの決まり（デザインページ「CP PAIR — 部品シート」 `j_C4BQ0FH`）

## 色トークン

| 名前 | id | 値 |
|---|---|---|
| CP paper | `kl8VXvaIM` | `#F4F2EB` |
| CP ink | `SC8uq7EE3` | `#22231F` |
| CP muted | `W0brTCMkj` | `#75766D` |
| CP line | `CkOmUdZdx` | `#D8D8CE` |
| CP accent | `a7DtIEZoH` | `#F4523D` |
| CP soft | `vDcPmJKek` | `#E9E9DF` |

ダークの値はトークンに無い。トークン以外の色は結果画面の黒いカードの上の補足文字 `rgb(188, 190, 177)` だけ。

## 文字スタイル

すべて Zen Kaku Gothic New、letter-spacing `-0.02em`、色 CP ink。

| 名前 | id | 太さ | 大きさ | 行の高さ |
|---|---|---|---|---|
| CP section | `uUqlDaRbo` | 900 | 17px | 1.5em |
| CP phrase | `Al2o1Hz3V` | 900 | 30px | 1.5em |
| CP body | `jJ1dOOYQW` | 500 | 14px | 1.8em |
| CP small | `phDSpJBNi` | 500 | 11px | 1.6em |
| CP label | `sAS8XY6m6` | 700 | 12px | 1.5em |
| CP title | `tE6RqninO` | 900 | 24px | 1.45em |

リンクのスタイル CP Source（`L7rQ5OG8k`）: 色 `#75766D`、下線、hover で `#22231F`。

## 結果画面

幅 390px、地は CP paper、縦に積む。

- ブランド `R6RbiAUfR`: padding 24 24 16 24、gap 9、横並び中央揃え、maxWidth 440
  - ロゴ SVG 30×20.4
  - 「CP PAIR」 Anton 400 24px、行 1.45em、-0.02em
  - 「ふたりだけの結果」 CP small、CP muted、右寄せ、幅 1fr
- マッチ結果 `W5i0RDzLH`: padding 16 24 32 24、gap 28
  - あなたのマッチ相手 `W3MD1a4KO`: gap 14
    - 結果ラベル: gap 8。Phosphor `Intersect` 17px ＋「YOUR PHILOSOPHY PARTNER」 Inter 700 10px、行 1.6em、0.12em
    - 名前の行: gap 12、中央揃え。名前 Zen 900 48px、行 1.2em、-0.04em ／「さん」 CP body ／ ロゴ 54×36.72 を右端（幅 1fr の枠の末尾）
    - 相手の企業理念 `yVtV5IpsY`: 塗り CP ink、角丸 24、padding 24、gap 18
      - 「○○さんが選んだ理念」 CP small、`rgb(188,190,177)`
      - 理念 Zen 900 26px、行 1.45em、色 CP paper、text-wrap pretty
      - 企業名 CP small、`rgb(188,190,177)`
    - 相性と称号 `P74_Bj9RK`: padding-top 4、gap 16、中央揃え
      - 相性度（幅 98）: 「100%」 Anton 42px、行 1.1em、CP accent ／「こじつけ相性度」 Zen 500 9px、行 1.6em、CP muted
      - ペアの称号（gap 4）: 「実は非上場！」 CP label、CP accent ／「表舞台 × 裏の実力者」「ギャップペア」 Zen 700 16px、行 1.5em（2 つの別の文字ノード）
  - 話しかけるきっかけ `oIXT7TAd0`: 上の線 1px CP line、padding-top 24、gap 12
    - 見出し: gap 8。Phosphor `Sparkle` 18px ＋「まずは、こんな話から。」 CP label
    - 本文 CP body
    - 発動したトリガー（gap 8、縦）: 塗り CP soft、角丸 8、padding 6 11、gap 7。Phosphor 14px ＋ Inter 700 11px、行 1.6em（描画上の高さ 20px、札の高さ 32px）
      - 無人島サバイバル適性 = `Sparkle`、非上場・裏の顔 = `Heart`、同い年創業（1899年）= `Intersect`
  - あなたが選んだ理念 `bJjVzFS_I`: 線 1px `#D8D8CE`、角丸 20、padding 20、gap 8
    - 「YOU · あなたが選んだ理念」 Inter 700 11px、CP muted
    - 理念 Zen 900 21px、行 1.45em
    - 企業名 CP small、CP muted
  - ふたりの診断カルテ `RVBXPbAzy`: 上の線 1px、padding-top 24、gap 24
    - 見出し Zen 700 16px、行 1.5em
    - 1 人分（gap 8）: 「アオイさん」／「あなた」 CP small muted ／「LG-型 · スマート合理主義タイプ」 Zen 700 14px 行 1.5em ／「1899年創業 / 外食 / 上場」 CP small muted ／ 性格診断 Zen 500 13px 行 1.8em ／「企業情報の出典」 CP small ＋ CP Source
  - ゲームについて `dRC26Wq3b`: 塗り CP soft、角丸 12、padding 16、gap 8、中央揃え
    - 「理念はまじめ。相性は、こじつけ。」 CP label ／ 説明 CP small muted
- 全体の高さ 1459px

## 部品

| 部品 | id | 値 |
|---|---|---|
| CP 主ボタン | `oMAZq6Ik4` | 342×48、塗り CP ink、角丸 24、padding 12 20、文字 CP label・CP paper。押せない: 不透明度 0.35・cursor not-allowed。Pressed: 0.8 |
| CP 副ボタン | `Vgo82sLqu` | 主ボタンと同じ形。塗り CP soft、文字 CP ink。既定のラベル「入れ替える」 |
| CP 文字リンクボタン | `PEwhoSoyL` | 主ボタンと同じ形。塗り CP paper、文字 CP ink。既定のラベル「参加者を手動で追加」 |
| CP ニックネーム入力 | `wUp4OxnQq` | label 要素、gap 8。「ニックネーム」 CP label ／ 入力欄 高さ 52、角丸 12、線 1px `#D8D8CE`、padding 12 16、Zen 500 16px、行 1.2em |
| CP 性別選択 | `J4wJ6rpFp` | 塗り CP soft、角丸 16、padding 4、gap 8。選択肢 高さ 44、角丸 12、padding 8 16。選んだ方は塗り CP ink・文字 CP paper |
| CP 選択肢カード | `XPe_N9uRH` | 塗り CP paper、線 1px `#D8D8CE`、角丸 20、padding 20、gap 12、最小の高さ 108。上の行: 「企業理念」（Category）CP small muted ＋ 選択済みマーク（24×24、角丸 12、塗り CP paper、記号 Done 16px）。本文 CP section。選択済み: 塗り・線 CP ink、文字 CP paper、マークを出す |
| CP バッジ | `hogHJEghq` | 塗り CP soft、角丸 8、padding 6 10、CP small |
| CP 参加者の行 | `DkHwa6fLy` | 塗り CP paper、線 1px、角丸 20、padding 16、gap 12。記号 Person 28px ＋ 名前 CP section ＋ 性別・参加方法 CP small muted（gap 8）／「選び終えた」 CP label（まだ: 「まだ選んでいません」 CP muted）／ 操作ボタン（塗り CP soft、高さ 44、角丸 22、CP label。選び終えた: 「参加情報を確認」、まだ: 「この端末で選ぶ」）＋ 削除ボタン 44×44（記号 Remove 16px） |
| CP 進行ステップ | `p_6G2PpCJ` | 3 列、gap 8。番号 28×28 角丸 14 CP label ／ 名前 CP small（お題・参加・選択・結果）。現在: 塗り CP ink・文字 CP paper、ほか: 塗り CP soft・文字 CP muted |
| CP フローティング操作バー | `cFuw2JrcM` | 幅 358、塗り CP paper、不透明度 0.94、backgroundBlur 20px、線 1px `rgba(244,242,235,0.9)`、影 `0 4 16 rgba(34,35,31,0.08)`、角丸 28、padding 12、gap 8。説明 CP small muted 中央 ＋ CP 主ボタン |

## 記号とロゴ

記号のセット「CP PAIR Symbols」（VectorSetNode `qVkSETKBD`）: Pair、Person、Secret、Talk、Spark、Done、Swap、Remove。64×64 の塊（CP ink）と目（CP paper）。`tree.toSVG` のパスを `src/ui/symbols.tsx` に写した。書き出しに付いた `stroke="#AAA"` は外した。

ロゴ「PAIR・ふたつの視線」（SVGNode `ryVq3MygI` / `Y6ZEI5SZK`）: viewBox 64×44、枠は 30×20.4 と 54×36.72。

## アイコン（Phosphor）

結果画面の `Intersect`・`Sparkle`・`Heart` は Framer の Phosphor のセット（`omX0gWFPqDwhaiWwf6ab`）で、`tree.toSVG` で書き出せない。npm の `@phosphor-icons/react` の regular を使う。Framer の設定は color `#22231F`、width 1.5、alpha 0。

## 部品シートの決まり

部品シートに書かれている文（原文）:

- 色と文字: 「結果画面の CP カラーと日本語書体を継承。コンテンツは不透明な紙の面で統一。」
- ボタン: 「各列：押せる / 押せない。タップ時は軽く沈み、無効状態は操作を受け付けません。」
- 入力と性別: 「入力欄は16pxの文字で読みやすく。性別は色分けせず、選択した面の反転で伝えます。」
- 共通の選択肢カード: 「お題も企業理念も同じ部品。理念選びでは企業名を出さず、長文も省略しません。」
- バッジと参加者: 「性別・参加方法・完了状況は文字でも明示。選んだ企業理念は参加管理に表示しません。」
- 進行ステップ: 「3段階のうち、現在地は反転した番号と太字で表示します。」
- 操作の層 / Liquid Glass: 「背景の内容を薄く透かすのは操作バーだけ。文字と主ボタンは不透明にし、読みやすさを保ちます。」「浮いた操作バーにだけ、薄い透過・ぼかし・輪郭を使用します。カード、バッジ、入力欄は不透明な紙の面を保ちます。」
- 記号: 「丸みのある太い塊と、最小限の目。内容を邪魔しない大きさで使います。」

## 比べた画像

- `docs/design/framer-result.jpg`: Framer の `tree.screenshot`（WQLkyLRf1）
- `docs/design/result-compare.png`: 左 Framer、中 アプリ、右 差分（濃いほど違う）
