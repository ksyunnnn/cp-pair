#!/bin/sh
# README の紹介の動く画像（docs/demo/pick-to-result.webp）を録り直す。手順は README の「紹介の動く画像の撮り直し方」。
#   npm run dev -- --port 5199   （別のターミナルで先に起動しておく）
#   sh scripts/demo.sh
# ブラウザは画面に出さない。録画の途中のファイルは .playwright-cli/demo/ に残る（追跡しない）。
set -eu

CLI="npx -y @playwright/cli@latest"
WORK=.playwright-cli/demo
OUT=docs/demo/pick-to-result.webp

mkdir -p "$WORK"
rm -f "$WORK"/raw*.webm

$CLI open http://localhost:5199/
$CLI resize 390 844
$CLI run-code --filename=scripts/demo-setup.js
$CLI video-start "$WORK/raw.webm" --size 390x844 --fps 25
$CLI run-code --filename=scripts/demo-record.js
$CLI video-stop
$CLI close

sh scripts/demo-encode.sh "$WORK/raw.webm" "$OUT"
