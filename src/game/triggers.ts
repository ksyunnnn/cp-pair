// gemini_output/v1.1_モック.html の TRIGGER_CONFIG を移したもの。値と式は変えない（キャラ型の判定の並びだけ ARCHETYPE_RULES に出した）。
import type { Archetype, Company } from "./types.ts";

// キャラ型の判定。診断カルテの文（personality_comment）を上から順に照らし、最初に当てはまった型にする。
// 結果画面の「診断の説明」が語の一覧を読むため、classify から取り出して並べた（値と順は元のまま）。
export const ARCHETYPE_RULES: readonly (Archetype & { pattern: RegExp })[] = [
  { code: "RM-型", label: "夢見るロマンチスト気質", pattern: /ロマン|夢|ドラマ|サプライズ|芸術|理想/ },
  { code: "ST-型", label: "鉄壁の安心・堅実派", pattern: /堅実|安心|誠実|安全|家庭|守|計画/ },
  { code: "LG-型", label: "スマート合理主義タイプ", pattern: /合理|効率|スマート|直球|マイペース/ },
  { code: "AC-型", label: "熱血チャレンジャー気質", pattern: /情熱|野心|行動|挑戦|冒険|エネルギー/ },
];
export const ARCHETYPE_FALLBACK: Archetype = { code: "HM-型", label: "愛されムードメーカー気質" };

export const TRIGGER_CONFIG = {
  unlistedSecret: {
    enabled: true,
    bothBonus: 12,
    singleBonus: 7,
    badgeColor: "from-slate-800 via-indigo-900 to-purple-900",
    buildTitle: (_cA: Company, _cB: Company, bothUnlisted: boolean) =>
      bothUnlisted
        ? `🕶️ 実は両方とも非上場！水面下で動く「謎の大物」ペア`
        : `🕵️ 実は非上場！表舞台 × 裏の実力者ギャップペア`,
    buildStory: (cA: Company, cB: Company, bothUnlisted: boolean) => {
      const unlistedNames = [cA, cB]
        .filter((c) => !c.metrics.is_listed)
        .map((c) => c.company_name)
        .join("」＆「");
      return bothUnlisted
        ? `「${unlistedNames}」はどちらも株主に縛られない非上場企業！「え、そこ非上場なの！？」という意外性と裏の顔を持つ謎の強者コンビです。`
        : `実は「${unlistedNames}」は非上場企業！華やかな表の顔と、マイペースに実力を蓄える裏の顔が噛み合う通好みな組み合わせです。`;
    },
  },
  sameIndustry: {
    enabled: true,
    bonus: 8,
    badgeColor: "from-red-500 to-orange-500",
    buildTitle: (cA: Company) => `🔥 禁断の同業ライバルペア（${cA.industry}）`,
    buildStory: (cA: Company, cB: Company) =>
      `同じ「${cA.industry}」業界の${cA.company_name}と${cB.company_name}を選択！良きライバルであり、業界あるあるで一番盛り上がれる熱い組み合わせです。`,
  },
  foundedYear: {
    enabled: true,
    sameYearBonus: 12,
    centuryGapBonus: 6,
    badgeColorGap: "from-indigo-500 to-cyan-500",
    badgeColorSame: "from-emerald-500 to-teal-600",
    buildSameYearTitle: (year: number) => `🎂 奇跡の同い年創業（${year}年）シンクロペア！`,
    buildSameYearStory: (cA: Company, cB: Company) =>
      `なんと「${cA.company_name}」と「${cB.company_name}」はどちらも${cA.metrics.founded_year}年創業の同期企業！生まれた時代がまったく同じ運命の同級生ペアです。`,
    buildGapTitle: (gap: number) => `⏳ 創業年差${gap}年！老舗×新興のタイムスリップペア`,
    buildGapStory: (older: Company, newer: Company, gap: number) =>
      `${older.metrics.founded_year}年創業の「${older.company_name}」と、${newer.metrics.founded_year}年創業の「${newer.company_name}」（差${gap}年）。伝統の安心感と革新のスピード感が交差します！`,
  },
  personalityArchetype: {
    enabled: true,
    bonus: 4,
    classify: (company: Company): Archetype => {
      const text = company.creative.personality_comment;
      const rule = ARCHETYPE_RULES.find((r) => r.pattern.test(text));
      return rule ? { code: rule.code, label: rule.label } : { ...ARCHETYPE_FALLBACK };
    },
  },
};
