// 診断の説明（#/rules）に出す中身。相性度・キャラ型・タグ・称号が何から決まるかを、計算の値と文言から組み立てる。
// 点と称号とキャラ型は engine.ts・triggers.ts・presets.ts の値を読む。条件の言い回しだけはここで書き下す（式は各ファイルの行を参照）。
import { BALANCE_TITLE, HYBRID_TITLE } from "./engine.ts";
import { splitTitle } from "./present.ts";
import { ARCHETYPE_FALLBACK, ARCHETYPE_RULES, TRIGGER_CONFIG } from "./triggers.ts";
import { PRESET_PROMPTS } from "./presets.ts";
import type { Archetype, Company, CompanyParams } from "./types.ts";

/** 値が人や組によって変わるところ（業界・創業年・型）を伏せる記号 */
const ANY = "○○";

/** 称号の builder に渡す仮の企業。称号の文言のうち、企業によって変わるところを ANY にする */
const ANY_COMPANY = {
  company_name: ANY,
  industry: ANY,
  metrics: { founded_year: ANY as unknown as number },
} as Company;

/** 企業の 3 つの値（companies.json の creative.params、1〜5）。
 * 呼び名と両端の言葉は gemini_output/参考_超初期のデータセット仕様書・活用アイデア集.md 40-42 行 */
export const PARAM_LABELS: readonly { key: keyof CompanyParams; label: string; low: string; high: string }[] = [
  { key: "stability", label: "堅実・安定度", low: "冒険家・刺激好き", high: "安心感・誠実重視" },
  { key: "passion", label: "熱血・野心度", low: "まったり・マイペース", high: "情熱的・野心家" },
  { key: "romance", label: "ロマン・感性度", low: "現実的・合理主義", high: "夢見がち・ロマンチスト" },
];

/** 先頭の絵文字を除いた称号（splitTitle と同じ除き方） */
function plainTitle(title: string): string {
  const t = splitTitle(title);
  return t.kicker ? `${t.kicker}${t.body}` : t.body;
}

/** お題のトリガーの条件。presets.ts の各 evaluate を書き下したもの */
const PRESET_CONDITION: Record<string, string> = {
  // presets.ts 11-16
  desert_island: "ふたりとも堅実・安定度 4 以上、またはどちらかの業界がインフラ・飲料・食品・日用品・製薬・エネルギー・小売",
  // presets.ts 27-30
  theme_song: "ふたりとも熱血・野心度 4 以上、またはキャラ型が同じ",
  // presets.ts 41-45
  propose: "ふたりともロマン・感性度 4 以上、またはふたりとも堅実・安定度 4 以上",
  // presets.ts 56-61
  first_date: "どちらかの堅実・安定度が 5、またはどちらかの業界が鉄道・航空・通信・外食・小売・旅行・観光",
  // presets.ts 72-77
  gokon_vibe: "ふたりの熱血・野心度とロマン・感性度の合計が 15 以上",
};

export interface TagRule {
  tag: string;
  points: number;
  condition: string;
}

export interface PresetTagRule extends TagRule {
  /** お題の文（presets.ts の label） */
  theme: string;
}

/** お題ごとのタグと点。お題で選んだ 1 つだけが判定に使われる（engine.ts 88-105） */
export function presetTagRules(): PresetTagRule[] {
  return PRESET_PROMPTS.map((p) => ({
    theme: p.label,
    tag: p.tagLabel,
    points: p.bonus,
    condition: PRESET_CONDITION[p.id] ?? "",
  }));
}

/** お題によらないタグと点。並びは engine.ts 106-128 の加点の順 */
export function commonTagRules(): TagRule[] {
  const t = TRIGGER_CONFIG;
  return [
    { tag: "非上場・裏の顔", points: t.unlistedSecret.singleBonus, condition: "どちらかが非上場" },
    { tag: "W非上場・謎の大物", points: t.unlistedSecret.bothBonus, condition: "ふたりとも非上場" },
    { tag: `同業界（${ANY}）`, points: t.sameIndustry.bonus, condition: "業界が同じ" },
    { tag: `同い年創業（${ANY}年）`, points: t.foundedYear.sameYearBonus, condition: "創業年が同じ" },
    { tag: `創業年差${ANY}年`, points: t.foundedYear.centuryGapBonus, condition: "創業年の差が 100 年以上" },
    { tag: `キャラ診断一致（${ANY}）`, points: t.personalityArchetype.bonus, condition: "キャラ型が同じ" },
  ];
}

export interface TitleRule {
  condition: string;
  /** お題によって変わる段は、お題のタグごとの称号を並べる */
  titles: { tag?: string; title: string }[];
}

/** 称号の決まり方。上から順に、最初に当てはまったものになる（engine.ts 137-170） */
export function titleRules(): TitleRule[] {
  const t = TRIGGER_CONFIG;
  const one = (title: string) => [{ title: plainTitle(title) }];
  return [
    { condition: "ふたりとも非上場", titles: one(t.unlistedSecret.buildTitle(ANY_COMPANY, ANY_COMPANY, true)) },
    { condition: "どちらかが非上場", titles: one(t.unlistedSecret.buildTitle(ANY_COMPANY, ANY_COMPANY, false)) },
    {
      condition: "お題のタグが付いた",
      titles: PRESET_PROMPTS.map((p) => ({ tag: p.tagLabel, title: plainTitle(p.buildTitle(ANY_COMPANY, ANY_COMPANY)) })),
    },
    { condition: "業界が同じ", titles: one(t.sameIndustry.buildTitle(ANY_COMPANY)) },
    { condition: "創業年が同じ", titles: one(t.foundedYear.buildSameYearTitle(ANY_COMPANY.metrics.founded_year)) },
    { condition: "創業年の差が 100 年以上", titles: one(t.foundedYear.buildGapTitle(ANY_COMPANY.metrics.founded_year)) },
    // engine.ts 159-161: stabilitySync >= 0.75 は差 1 以下、passionGap・romanceGap >= 0.5 は差 2 以上（値は 1〜5、差を 4 で割る）
    { condition: "堅実・安定度の差が 1 以下で、熱血・野心度かロマン・感性度の差が 2 以上", titles: one(HYBRID_TITLE) },
    { condition: "どれにも当てはまらない", titles: one(BALANCE_TITLE) },
  ];
}

export interface ArchetypeRule extends Archetype {
  /** 診断コメント（personality_comment）にこの語のどれかが入っていれば、この型。空ならどれにも当てはまらないとき */
  words: string[];
}

/** キャラ型の一覧。上から順に照らす（triggers.ts の ARCHETYPE_RULES） */
export function archetypeRules(): ArchetypeRule[] {
  return [
    ...ARCHETYPE_RULES.map((r) => ({ code: r.code, label: r.label, words: r.pattern.source.split("|") })),
    { ...ARCHETYPE_FALLBACK, words: [] },
  ];
}
