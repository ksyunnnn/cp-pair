#!/bin/sh
# README の動く画像を、録画（WebM）からアニメーションする WebP に書き出す。手順は README の「紹介の動く画像の撮り直し方」。
#   sh scripts/demo-encode.sh .playwright-cli/demo/raw.webm docs/demo/pick-to-result.webp
# 要るもの: ffmpeg と img2webp（Homebrew の ffmpeg は WebP を書き出せないので、webp の img2webp を使う）。
#
# - 冒頭の静止（録画の開始から最初の操作まで）を ffmpeg の freezedetect で測り、最初の操作の 0.6 秒前から切り出す
# - 12fps に間引く。結果の発表は 12fps のコマで進む（src/screens/useReveal.ts）ので、動きは欠けない
# - 幅は録画と同じ 390px（README では幅 300 で見せる）。非可逆の品質 70
# - キーフレーム（前のコマに頼らず描くコマ）を 4 コマごとまでに入れる。既定のままだと、非可逆の差分の圧縮で
#   前の画面の淡い部分（理念選びの下のバーなど）が次の画面に影として残る。キーフレームを毎コマにするとこの 2 倍の重さになる
# - GIF（ffmpeg の palettegen / paletteuse）は同じ長さで 2.3MB になった（2026-11-27）。WebP はその約 1/5
set -eu

IN=${1:?録画の WebM を渡す}
OUT=${2:?書き出す WebP のパスを渡す}
FPS=12
QUALITY=70
LEAD=0.6

FREEZE_END=$(ffmpeg -hide_banner -i "$IN" -vf "freezedetect=n=0.001:d=0.3" -map 0:v -f null - 2>&1 |
  sed -n 's/.*freeze_end: \([0-9.]*\).*/\1/p' | head -n 1)
START=$(awk -v t="${FREEZE_END:-0}" -v lead="$LEAD" 'BEGIN { s = t - lead; if (s < 0) s = 0; print s }')

FRAMES=$(mktemp -d)
trap 'rm -rf "$FRAMES"' EXIT
ffmpeg -v error -ss "$START" -i "$IN" -vf "fps=$FPS" "$FRAMES/%04d.png"

DURATION=$((1000 / FPS))
mkdir -p "$(dirname "$OUT")"
img2webp -loop 0 -kmin 3 -kmax 4 -lossy -q "$QUALITY" -m 4 -d "$DURATION" "$FRAMES"/*.png -o "$OUT"
echo "start=${START}s frames=$(ls "$FRAMES" | wc -l | tr -d ' ') size=$(wc -c <"$OUT" | tr -d ' ')B -> $OUT"
