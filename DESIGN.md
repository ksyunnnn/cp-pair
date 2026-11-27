---
version: alpha
name: CP PAIR
description: 合コンで遊ぶ、真顔のパーティーゲーム。紙に墨で刷った書類のような画面。
colors:
  surface: "#F4F2EB"
  surface-sunken: "#E9E9DF"
  surface-inverse: "#22231F"
  text: "#22231F"
  text-muted: "#686961"
  text-inverse: "#F4F2EB"
  text-inverse-muted: "rgb(188, 190, 177)"
  text-accent: "#D3230C"
  accent: "#F4523D"
  border: "#D8D8CE"
  border-strong: "#22231F"
typography:
  title:
    fontFamily: Zen Kaku Gothic New
    fontSize: 24px
    fontWeight: 900
    lineHeight: 1.45
    letterSpacing: -0.02em
  phrase:
    fontFamily: Zen Kaku Gothic New
    fontSize: 30px
    fontWeight: 900
    lineHeight: 1.5
    letterSpacing: -0.02em
  section:
    fontFamily: Zen Kaku Gothic New
    fontSize: 17px
    fontWeight: 900
    lineHeight: 1.5
    letterSpacing: -0.02em
  body:
    fontFamily: Zen Kaku Gothic New
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.8
    letterSpacing: -0.02em
  label:
    fontFamily: Zen Kaku Gothic New
    fontSize: 12px
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: -0.02em
  small:
    fontFamily: Zen Kaku Gothic New
    fontSize: 11px
    fontWeight: 500
    lineHeight: 1.6
    letterSpacing: -0.02em
  display:
    fontFamily: Anton
    fontSize: 24px
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: -0.02em
rounded:
  chip: 8px
  field: 12px
  card: 20px
  card-ink: 24px
spacing:
  page-x: 24px
  block-gap: 28px
  page-max: 440px
components:
  button-primary:
    backgroundColor: "{colors.surface-inverse}"
    textColor: "{colors.text-inverse}"
    typography: "{typography.label}"
    rounded: "{rounded.card-ink}"
    height: 48px
  button-secondary:
    backgroundColor: "{colors.surface-sunken}"
    textColor: "{colors.text}"
    typography: "{typography.label}"
    rounded: "{rounded.card-ink}"
    height: 48px
  choice-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.section}"
    rounded: "{rounded.card}"
    padding: 20px
  choice-card-selected:
    backgroundColor: "{colors.surface-inverse}"
    textColor: "{colors.text-inverse}"
  badge:
    backgroundColor: "{colors.surface-sunken}"
    textColor: "{colors.text}"
    typography: "{typography.small}"
    rounded: "{rounded.chip}"
  nickname-input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.field}"
    height: 52px
---

# CP PAIR

描画に使う値の原本は `@src/styles/tokens.css`、動きの値の原本は `@src/styles/motion.ts`。この文書の値は、文章から指すための写しで、描画の指示ではない。値を変えるときは原本を直し、この文書の写しを合わせる。

## Overview

合コンで遊ぶ、真顔のパーティーゲーム。企業理念という真面目なものを、こじつけで笑いに変える。画面は「役所の窓口で渡される、紙に墨で刷った書類」のように振る舞う。ふざけた内容を、ふざけない体裁で出すことが面白さの源になる。

- iPhone の Safari の縦画面だけを前提にする
- 電波のない店でも、ホストの端末 1 台で最後まで遊べる
- 飾りで盛り上げない。盛り上げるのは結果の発表の一瞬（判を押す動き）だけ

## Colors

紙 {colors.surface} と墨 {colors.surface-inverse} の 2 色が骨格で、朱 {colors.accent} を 1 色だけ差す。

- **紙** {colors.surface}：すべての面の地。真っ白にしない
- **刷りの薄い面** {colors.surface-sunken}：副ボタン・バッジ・性別選択の溝など、紙より一段沈んだ面
- **墨** {colors.text}：文字・主ボタン・選んだカード・結果の黒いカード。真っ黒にしない
- **薄墨** {colors.text-muted}：補足の文字。Framer の値（#75766D）は紙の上で 4.10:1 と WCAG 2.2 AA の 4.5:1 に届かないので、明度だけ下げた
- **墨の上の文字** {colors.text-inverse}・{colors.text-inverse-muted}：黒いカードの上でだけ使う
- **朱** {colors.accent}：相性度の数字や印など、大きい文字と記号だけ。紙の上で 3.06:1 なので、小さい文字には使わない
- **朱の文字** {colors.text-accent}：小さい文字で朱を使うときの色（紙の上で 4.67:1）
- **罫** {colors.border}：カードと入力欄の 1px の線
- **濃い罫** {colors.border-strong}：フォーカスの輪郭、入力中の入力欄の線、コントラストを上げる設定のときの縁

色は `tokens.css` で 2 段に分けてある。`--palette-*` は値そのもので、`tokens.css` の外では使わない。部品はこの節の用途の名前（`--surface`・`--text` など）だけを使う。

## Typography

日本語は Zen Kaku Gothic New、ロゴと相性度の数字は Anton、結果画面の英字の見出しは Inter。字間はどれも詰め気味（-0.02em）にして、書類の活字のように締める。

- 見出しの段は title（24px）・section（17px）の 2 つ。太さは 900
- 本文は body（14px、行の高さ 1.8）。補足は small（11px）
- ボタンと札は label（12px、700）
- 大きさの段を増やさない。新しい画面でも、まず既存の段で組む

## Layout

縦に積む 1 列だけで組む。左右の余白は {spacing.page-x}、ブロックどうしの間は {spacing.block-gap}、本文の幅は最大 {spacing.page-max}。

- 画面は「見出し → 区画の積み重ね → 下に浮いた操作バー」の順に並べる
- 浮いた操作バーの下に本文が隠れないよう、ページの下端に余白（`--floating-clearance`）を取る
- 押せるものは 44×44pt 以上。小さい文字のリンクは、見た目を変えずに押せる範囲だけ広げる

## Elevation & Depth

面は不透明な紙で統一する。奥行きを出すのは、下に浮いた操作バーとトーストだけ（操作の層）。

- 操作の層は Liquid Glass：薄い透過・ぼかし・明るい輪郭。値は `tokens.css` の `--glass-*`
- 文字と主ボタンは、ガラスの上でも読める濃さを保つ
- 透明度を下げる設定（prefers-reduced-transparency）では、ガラスをほぼ不透明な紙にする

## Shapes

角丸は 4 段：札 {rounded.chip}、入力欄 {rounded.field}、カード {rounded.card}、黒いカードとボタン {rounded.card-ink}。高さの半分で丸めるもの（ボタン・番号・印）は、高さとともに決める。

## Motion & Micro-interaction

テーマは「判を押して、止まる」。速く打って、着地したら止める。着地の後は動かさない。

- 時間は 24fps のコマ（41.7ms）の倍数に揃える。記号の差し替えは 12fps のコマ打ち
- ボタンとトーストは Apple の spring（bounce 0〜0.15）
- 判を押す動き（ため → 止め → 打ち → 収め）は、結果の発表と、選んだカードにだけ使う
- reduced motion では動きを止め、opacity の変化だけを残す
- 値はすべて `@src/styles/motion.ts`。CSS で使う時間も、そこから `--motion-*` として書き込む

## Voice & Content Strategy

真顔で書く。説明は短く、役所の書類のように平らに。笑いは内容（理念のこじつけ）に任せ、文言でははしゃがない。

- ゲームの仕組み（診断とマッチング）は、お題に答える段階では伏せる
- 選んだ理念は、参加者の管理の画面には出さない

## Components

部品の実装は `@src/ui/components.tsx` と `@src/ui/symbols.tsx`。見た目は `src/styles/components/` の部品ごとの CSS にある。

- **主ボタン・副ボタン・文字リンクボタン**：同じ形（高さ 48px）で、塗りだけが違う。押せないときは不透明度 0.35 で操作を受け付けない。押すと軽く沈む
- **ニックネーム入力**：文字は 16px（iPhone で拡大されない大きさ）
- **性別選択**：色で分けない。選んだ面の反転（墨の面に紙の文字）で伝える
- **選択肢カード**：お題も企業理念も同じ部品。理念選びでは企業名を出さず、長文も省略しない
- **バッジ・参加者の行**：性別・参加方法・完了の状況は文字でも示す
- **進行ステップ**：3 段のうち、いまの段は反転した番号で示す
- **浮いた操作バー**：背景を薄く透かすのはこれだけ
- **記号**：丸みのある太い塊と、最小限の目。内容を邪魔しない大きさで使う

## Do's and Don'ts

- **Do** 紙と墨の 2 色で組み、朱は 1 画面に 1 か所の山にだけ使う
- **Do** 新しい画面は、既存の部品と文字の段で組めないかを先に確かめる
- **Don't** カード・バッジ・入力欄をガラスにしない。ガラスは浮いた操作の層だけ
- **Don't** ガラスの上にガラスを重ねない
- **Don't** 性別を色で分けない
- **Don't** 結果の発表以外で、判を押す動きや大きな動きを使わない
- **Don't** 朱を小さい文字に使わない（使うなら朱の文字の色）
- **Don't** 値を CSS に直書きしない。`tokens.css` の用途の名前を使う。1 つの部品でしか使わない値は、その部品のファイルに `--_*` として置く
