// gemini_output/v1.1_モック.html の DatasetRepository と MatchingEngine を移したもの。値と式は変えない。
// モックとの違いは、runMatching が preset の代わりに presetId を返すことと、既定の 2 つの称号を定数に出したこと（結果を JSON で保存するため・説明で読むため）。
import { PRESET_PROMPTS } from "./presets.ts";
import { TRIGGER_CONFIG } from "./triggers.ts";
import type {
  Company,
  CompanyParams,
  MatchPair,
  MatchResult,
  MatchedPerson,
  PairEvaluation,
  Participant,
  PresetPrompt,
} from "./types.ts";

// どの条件にも当てはまらないときの称号。結果画面の「診断の説明」も読むため、evaluatePair から取り出した（文言は元のまま）。
export const HYBRID_TITLE = `💎 理想のハイブリッド！堅実シンクロ × 凸凹補完ペア`;
export const BALANCE_TITLE = `💞 絶妙バランス！理念クロス・パートナー`;

export class DatasetRepository {
  private readonly _items: readonly Company[];
  private readonly _byId: Map<number, Company>;

  constructor(rawData: Company[]) {
    this._items = Object.freeze(rawData.map((item) => Object.freeze(item)));
    this._byId = new Map(this._items.map((item) => [item.id, item]));
  }

  getAll(): readonly Company[] {
    return this._items;
  }

  getById(id: number | string): Company | null {
    return this._byId.get(Number(id)) || null;
  }

  getRandomPool(count = 8, minAffinity = 4, excludedIds: Set<number> = new Set()): Company[] {
    const availableAll = this._items.filter((item) => !excludedIds.has(item.id));
    const preferred = availableAll.filter((item) => item.metrics.b2c_affinity >= minAffinity);
    const pool = preferred.length >= count ? [...preferred] : [...availableAll];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, count);
  }
}

export class MatchingEngine {
  static calculateHybridBase(paramsA: CompanyParams, paramsB: CompanyParams) {
    const stabilitySync = 1 - Math.abs(paramsA.stability - paramsB.stability) / 4;
    const passionGap = Math.abs(paramsA.passion - paramsB.passion) / 4;
    const romanceGap = Math.abs(paramsA.romance - paramsB.romance) / 4;

    const hybridRatio = (stabilitySync + passionGap + romanceGap) / 3;
    const baseScore = Math.round(52 + hybridRatio * 38);

    return {
      baseScore,
      axes: {
        stabilitySync: Number(stabilitySync.toFixed(2)),
        passionGap: Number(passionGap.toFixed(2)),
        romanceGap: Number(romanceGap.toFixed(2)),
      },
    };
  }

  static evaluatePair(
    personA: { company: Company },
    personB: { company: Company },
    options: { preset?: PresetPrompt } = {},
  ): PairEvaluation {
    const preset = options.preset || PRESET_PROMPTS[0];
    const cA = personA.company;
    const cB = personB.company;

    const hybrid = this.calculateHybridBase(cA.creative.params, cB.creative.params);

    const isSameIndustry = cA.industry === cB.industry;
    const yearGap = Math.abs(cA.metrics.founded_year - cB.metrics.founded_year);
    const isSameFoundedYear = yearGap === 0;
    const isCenturyGap = yearGap >= 100;

    const unlistedCount = [!cA.metrics.is_listed, !cB.metrics.is_listed].filter(Boolean).length;
    const hasUnlisted = unlistedCount > 0;
    const bothUnlisted = unlistedCount === 2;

    const typeA = TRIGGER_CONFIG.personalityArchetype.classify(cA);
    const typeB = TRIGGER_CONFIG.personalityArchetype.classify(cB);
    const isSameArchetype = typeA.code === typeB.code;

    const isThemeTriggered = Boolean(
      preset && typeof preset.evaluate === "function" && preset.evaluate(cA, cB, { isSameArchetype }),
    );

    const triggeredTags: string[] = [];
    const breakdown = {
      baseScore: hybrid.baseScore,
      themeBonus: 0,
      unlistedBonus: 0,
      sameIndustryBonus: 0,
      foundedYearBonus: 0,
      archetypeBonus: 0,
    };

    if (isThemeTriggered) {
      breakdown.themeBonus = preset.bonus;
      triggeredTags.push(preset.tagLabel);
    }
    if (TRIGGER_CONFIG.unlistedSecret.enabled && hasUnlisted) {
      breakdown.unlistedBonus = bothUnlisted
        ? TRIGGER_CONFIG.unlistedSecret.bothBonus
        : TRIGGER_CONFIG.unlistedSecret.singleBonus;
      triggeredTags.push(bothUnlisted ? "W非上場・謎の大物" : "非上場・裏の顔");
    }
    if (TRIGGER_CONFIG.sameIndustry.enabled && isSameIndustry) {
      breakdown.sameIndustryBonus = TRIGGER_CONFIG.sameIndustry.bonus;
      triggeredTags.push(`同業界(${cA.industry})`);
    }
    if (TRIGGER_CONFIG.foundedYear.enabled) {
      if (isSameFoundedYear) {
        breakdown.foundedYearBonus = TRIGGER_CONFIG.foundedYear.sameYearBonus;
        triggeredTags.push(`同い年創業(${cA.metrics.founded_year}年)`);
      } else if (isCenturyGap) {
        breakdown.foundedYearBonus = TRIGGER_CONFIG.foundedYear.centuryGapBonus;
        triggeredTags.push(`創業年差${yearGap}年`);
      }
    }
    if (TRIGGER_CONFIG.personalityArchetype.enabled && isSameArchetype) {
      breakdown.archetypeBonus = TRIGGER_CONFIG.personalityArchetype.bonus;
      triggeredTags.push(`キャラ診断一致(${typeA.code})`);
    }

    const totalRaw = Object.values(breakdown).reduce((sum, v) => sum + v, 0);
    const score = Math.min(100, Math.max(50, totalRaw));

    let title = "";
    let badgeColor = "from-pink-500 to-purple-600";
    let story = "";

    if (hasUnlisted) {
      title = TRIGGER_CONFIG.unlistedSecret.buildTitle(cA, cB, bothUnlisted);
      badgeColor = TRIGGER_CONFIG.unlistedSecret.badgeColor;
      story = TRIGGER_CONFIG.unlistedSecret.buildStory(cA, cB, bothUnlisted);
    } else if (isThemeTriggered) {
      title = preset.buildTitle(cA, cB);
      badgeColor = preset.badgeColor;
      story = preset.buildStory(cA, cB);
    } else if (isSameIndustry) {
      title = TRIGGER_CONFIG.sameIndustry.buildTitle(cA);
      badgeColor = TRIGGER_CONFIG.sameIndustry.badgeColor;
      story = TRIGGER_CONFIG.sameIndustry.buildStory(cA, cB);
    } else if (isSameFoundedYear) {
      title = TRIGGER_CONFIG.foundedYear.buildSameYearTitle(cA.metrics.founded_year);
      badgeColor = TRIGGER_CONFIG.foundedYear.badgeColorSame;
      story = TRIGGER_CONFIG.foundedYear.buildSameYearStory(cA, cB);
    } else if (isCenturyGap) {
      const older = cA.metrics.founded_year < cB.metrics.founded_year ? cA : cB;
      const newer = older.id === cA.id ? cB : cA;
      title = TRIGGER_CONFIG.foundedYear.buildGapTitle(yearGap);
      badgeColor = TRIGGER_CONFIG.foundedYear.badgeColorGap;
      story = TRIGGER_CONFIG.foundedYear.buildGapStory(older, newer, yearGap);
    } else if (
      hybrid.axes.stabilitySync >= 0.75 &&
      (hybrid.axes.passionGap >= 0.5 || hybrid.axes.romanceGap >= 0.5)
    ) {
      title = HYBRID_TITLE;
      badgeColor = "from-violet-600 to-pink-500";
      story = `安心感のベース（堅実度）はピタリと一致しつつ、熱量やロマンの違いで刺激し合える理想のバランス！`;
    } else {
      title = BALANCE_TITLE;
      badgeColor = "from-pink-500 to-purple-600";
      story = `「${cA.phrase}」と「${cB.phrase}」が交差する好相性ペア！お互いの診断タイプ（${typeA.label} × ${typeB.label}）をネタに乾杯しましょう。`;
    }

    return {
      score,
      title,
      badgeColor,
      story,
      triggeredTags,
      archetypes: { personA: typeA, personB: typeB },
      debug: {
        hybridAxes: hybrid.axes,
        yearGap,
        isThemeTriggered,
        isSameIndustry,
        hasUnlisted,
        bothUnlisted,
        isSameArchetype,
        breakdown,
      },
    };
  }

  static runMatching(
    participants: Participant[],
    repo: DatasetRepository,
    config: { preset?: PresetPrompt } = {},
  ): MatchResult {
    const preset = config.preset || PRESET_PROMPTS[0];

    const active: MatchedPerson[] = participants
      .filter((p) => p.selectedCompanyId !== null)
      .map((p) => ({ ...p, company: repo.getById(p.selectedCompanyId as number) as Company }))
      .filter((p) => Boolean(p.company));

    const matchedIds = new Set<string>();
    const pairs: MatchPair[] = [];

    const availMales = active.filter((p) => p.gender === "M");
    const availFemales = active.filter((p) => p.gender === "F");

    const candidates: { m: MatchedPerson; f: MatchedPerson; evaluation: PairEvaluation }[] = [];
    for (const m of availMales) {
      for (const f of availFemales) {
        const evaluation = this.evaluatePair(m, f, { preset });
        candidates.push({ m, f, evaluation });
      }
    }
    candidates.sort((a, b) => b.evaluation.score - a.evaluation.score);

    for (const cand of candidates) {
      if (matchedIds.has(cand.m.id) || matchedIds.has(cand.f.id)) continue;
      matchedIds.add(cand.m.id);
      matchedIds.add(cand.f.id);
      pairs.push({
        personA: cand.m,
        personB: cand.f,
        evaluation: cand.evaluation,
      });
    }

    const unmatched = active
      .filter((p) => !matchedIds.has(p.id))
      .map((p) => ({
        ...p,
        reason: "男女の人数差により、今回のマッチングではフリー／ジョーカー枠となりました。",
      }));

    return {
      pairs,
      unmatched,
      presetId: preset.id,
      timestamp: new Date().toISOString(),
    };
  }
}
