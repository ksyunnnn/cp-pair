# CLAUDE.md

cp-pair で Claude Code が従うルール。プロジェクトの概要・開発コマンド・配信・戻し方は `README.md` にある。

## Git

- main への push は許可を得てから行う
- コミットは許可なしで行ってよい
- push の前に、センシティブな情報が入っていないか確かめる。`.env.local` はコミットしない。`.env.production` の Firebase の値は秘密ではない

## ブランチとワークスペース

- 作業は `feature/*` ブランチで行い、main へ PR を作る
- `desk-NN` は git worktree の常設ワークスペースで、`repository/main` と並べて `repository/desk-01` のように置く
- `desk-NN` ブランチにはコミットしない。main を取り込むだけにし、作業は `desk-NN` の中で `feature/*` を checkout して行う

## 注意

- `firestore.rules` を変えたら、PR のマージとは別に、README の手順でルールをデプロイする。Workers Builds はルールをデプロイしない
