// 相性の計算がモック（gemini_output/v1.1_モック.html）と同じ結果を返すかを確かめる。
// 実行: npm run verify
import { readFileSync } from "node:fs";
import { DatasetRepository, MatchingEngine } from "../src/game/engine.ts";
import { getPreset } from "../src/game/presets.ts";
import type { Company, Participant } from "../src/game/types.ts";

const raw = JSON.parse(readFileSync(new URL("../src/data/companies.json", import.meta.url), "utf8")) as {
  items: Company[];
};
const repo = new DatasetRepository(raw.items);

const participants: Participant[] = [
  { id: "haruto", name: "ハルト", gender: "M", joinType: "device", selectedCompanyId: 2 },
  { id: "riku", name: "リク", gender: "M", joinType: "manual", selectedCompanyId: 83 },
  { id: "aoi", name: "アオイ", gender: "F", joinType: "device", selectedCompanyId: 9 },
  { id: "mei", name: "メイ", gender: "F", joinType: "device", selectedCompanyId: 17 },
];

const result = MatchingEngine.runMatching(participants, repo, { preset: getPreset("desert_island") });
const pair = result.pairs.find((p) => p.personA.id === "haruto");

const expected = {
  partner: "aoi",
  score: 100,
  title: "🕵️ 実は非上場！表舞台 × 裏の実力者ギャップペア",
};
const actual = {
  partner: pair?.personB.id,
  score: pair?.evaluation.score,
  title: pair?.evaluation.title,
};

for (const p of result.pairs) {
  console.log(`${p.personA.name} × ${p.personB.name}  ${p.evaluation.score}%  ${p.evaluation.title}`);
  console.log(`  tags: ${p.evaluation.triggeredTags.join(" / ")}`);
}
const ok = JSON.stringify(expected) === JSON.stringify(actual);
console.log(ok ? "OK: モックの結果と一致" : `NG: expected ${JSON.stringify(expected)} actual ${JSON.stringify(actual)}`);
process.exit(ok ? 0 : 1);
