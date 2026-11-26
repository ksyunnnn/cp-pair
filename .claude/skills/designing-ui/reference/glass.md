# Web でのガラス（Liquid Glass に倣う）

Apple は Liquid Glass の部品を SwiftUI・UIKit・AppKit にしか配らない（https://developer.apple.com/documentation/technologyoverviews/liquid-glass ）。Web では見た目を自分で作り、次の決まりに従う。

## 決まり

1. ガラスはナビと操作の層（サイドバー・ツールバー・切り替え・シート・メニュー）に限る。表や詳細の本文は不透明な面にする
   - HIG Materials: "Don't use Liquid Glass in the content layer." https://developer.apple.com/design/human-interface-guidelines/materials
2. ガラスの上にガラスを重ねない。重なる部品は塗りにする
   - WWDC25 Meet Liquid Glass: "always avoid glass on glass" https://developer.apple.com/videos/play/wwdc2025/219/
   - CSS でも、`backdrop-filter` を入れ子にすると描画の負荷が増える（W3C Filter Effects Level 2 https://drafts.csswg.org/filter-effects-2/ ）
3. 大きい面ほど不透明に寄せる。全体の高さに広げたシートは不透明にする
   - HIG Color https://developer.apple.com/design/human-interface-guidelines/color 、Adopting Liquid Glass https://developer.apple.com/documentation/technologyoverviews/adopting-liquid-glass
4. 色は主な操作の背景にだけ使う
   - HIG Color: "To emphasize primary actions, apply color to the background rather than to symbols or text."
5. コントラストを上げる設定（`prefers-contrast: more`）では、不透明の地と境界線に切り替える。透明度を下げる設定（`prefers-reduced-transparency`）は Safari が CSS で受け取れないので、既定を不透明寄りにする
   - MDN https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-contrast

## cp-pair の実装

ガラスの値は `src/styles/tokens.css` の `--glass-*`、使い方は `src/styles/app.css` にある。`--glass-*` の値は HIG にも Framer のデザインの値（`docs/design/framer-values.md`）にもなく、`tokens.css` のコメントに「Framer にない値」と書いてある。出典のない値を足すときは、同じようにコメントに書き、PR の本文に挙げる。
