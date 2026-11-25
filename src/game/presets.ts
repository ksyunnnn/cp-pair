// gemini_output/v1.1_モック.html の PRESET_PROMPTS を移したもの。値と式は変えない。
import type { PresetPrompt } from "./types.ts";

export const PRESET_PROMPTS: PresetPrompt[] = [
  {
    id: "desert_island",
    label: "無人島にひとつだけ持っていくならどの企業理念？",
    tagLabel: "無人島サバイバル適性",
    bonus: 8,
    badgeColor: "from-emerald-600 to-teal-600",
    evaluate: (cA, cB) => {
      const highStability = cA.creative.params.stability >= 4 && cB.creative.params.stability >= 4;
      const survivalIndustryRegex = /(インフラ|飲料|食品|日用品|製薬|エネルギー|小売)/;
      const hasSurvivalIndustry = survivalIndustryRegex.test(cA.industry) || survivalIndustryRegex.test(cB.industry);
      return highStability || hasSurvivalIndustry;
    },
    buildTitle: () => `🏝️ 無人島サバイバル鉄壁ペア！`,
    buildStory: (cA, cB) =>
      `無人島お題で「${cA.company_name}」×「${cB.company_name}」をチョイス！生活基盤の安定感とサバイバル適性が高く、極限状態でも笑い合える頼もしさです。`,
  },
  {
    id: "theme_song",
    label: "自分の人生のテーマソングにしたい企業理念は？",
    tagLabel: "人生テーマソング共鳴",
    bonus: 8,
    badgeColor: "from-amber-500 to-orange-600",
    evaluate: (cA, cB, ctx) => {
      const highPassion = cA.creative.params.passion >= 4 && cB.creative.params.passion >= 4;
      return highPassion || ctx.isSameArchetype;
    },
    buildTitle: () => `🎵 人生のサビが完全一致！魂のテーマソングペア`,
    buildStory: (cA, cB) =>
      `人生のテーマソングに「${cA.phrase}」と「${cB.phrase}」を選ぶ2人！人生のテンポと熱量がシンクロする主役級コンビです。`,
  },
  {
    id: "propose",
    label: "プロポーズの言葉として言われたい（言いたい）理念は？",
    tagLabel: "プロポーズ価値観一致",
    bonus: 10,
    badgeColor: "from-rose-500 via-pink-500 to-fuchsia-600",
    evaluate: (cA, cB) => {
      const highRomance = cA.creative.params.romance >= 4 && cB.creative.params.romance >= 4;
      const highStability = cA.creative.params.stability >= 4 && cB.creative.params.stability >= 4;
      return highRomance || highStability;
    },
    buildTitle: () => `💍 プロポーズ観が合致！理想の結婚生活ペア`,
    buildStory: () =>
      `プロポーズお題でこの2社を選ぶ感性がピタリ！ロマンの温度感と家庭像が噛み合う、将来有望なカップル候補です。`,
  },
  {
    id: "first_date",
    label: "初デートの待ち合わせで一番頼りになりそうな理念は？",
    tagLabel: "初デート神エスコート",
    bonus: 8,
    badgeColor: "from-sky-500 to-indigo-600",
    evaluate: (cA, cB) => {
      const topStability = cA.creative.params.stability === 5 || cB.creative.params.stability === 5;
      const dateIndustryRegex = /(鉄道|航空|通信|外食|小売|旅行|観光)/;
      const hasDateIndustry = dateIndustryRegex.test(cA.industry) || dateIndustryRegex.test(cB.industry);
      return topStability || hasDateIndustry;
    },
    buildTitle: () => `🚃 絶対に遅刻・失敗しない！初デート神エスコートペア`,
    buildStory: (cA, cB) =>
      `初デートお題で「${cA.company_name}」×「${cB.company_name}」を選択！段取り力と安心感が抜群で、初デートから居心地最高な組み合わせです。`,
  },
  {
    id: "gokon_vibe",
    label: "今夜の合コンに対する意気込みを表す企業理念は？",
    tagLabel: "今夜の盛り上げ主役",
    bonus: 8,
    badgeColor: "from-purple-600 to-pink-600",
    evaluate: (cA, cB) => {
      const totalEnergy =
        cA.creative.params.passion + cA.creative.params.romance +
        cB.creative.params.passion + cB.creative.params.romance;
      return totalEnergy >= 15;
    },
    buildTitle: () => `🥂 今夜の合コン最高潮！ムードメーカー・ペア`,
    buildStory: (cA, cB) =>
      `今夜の意気込みに「${cA.phrase}」と「${cB.phrase}」を掲げる最強テンションペア！まずはこの2人の乾杯の音頭から始めましょう！`,
  },
];

export function getPreset(id: string | null | undefined): PresetPrompt {
  return PRESET_PROMPTS.find((p) => p.id === id) || PRESET_PROMPTS[0];
}
