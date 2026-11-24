export type Gender = "M" | "F";
export type JoinType = "device" | "manual";

export interface CompanyParams {
  passion: number;
  romance: number;
  stability: number;
}

export interface Company {
  id: number;
  company_name: string;
  phrase: string;
  phrase_type?: string;
  industry: string;
  source_url: string;
  metrics: {
    founded_year: number;
    is_listed: boolean;
    stock_code?: string | null;
    b2c_affinity: number;
  };
  creative: {
    personality_comment: string;
    params: CompanyParams;
  };
}

export interface Participant {
  id: string;
  name: string;
  gender: Gender;
  joinType: JoinType;
  selectedCompanyId: number | null;
}

export interface Archetype {
  code: string;
  label: string;
}

export interface PairEvaluation {
  score: number;
  title: string;
  badgeColor: string;
  story: string;
  triggeredTags: string[];
  archetypes: { personA: Archetype; personB: Archetype };
  debug: {
    hybridAxes: { stabilitySync: number; passionGap: number; romanceGap: number };
    yearGap: number;
    isThemeTriggered: boolean;
    isSameIndustry: boolean;
    hasUnlisted: boolean;
    bothUnlisted: boolean;
    isSameArchetype: boolean;
    breakdown: {
      baseScore: number;
      themeBonus: number;
      unlistedBonus: number;
      sameIndustryBonus: number;
      foundedYearBonus: number;
      archetypeBonus: number;
    };
  };
}

export type MatchedPerson = Participant & { company: Company };

export interface MatchPair {
  personA: MatchedPerson;
  personB: MatchedPerson;
  evaluation: PairEvaluation;
}

export type UnmatchedPerson = MatchedPerson & { reason: string };

export interface PresetPrompt {
  id: string;
  label: string;
  tagLabel: string;
  bonus: number;
  badgeColor: string;
  evaluate: (cA: Company, cB: Company, ctx: { isSameArchetype: boolean }) => boolean;
  buildTitle: (cA: Company, cB: Company) => string;
  buildStory: (cA: Company, cB: Company) => string;
}

export interface MatchResult {
  pairs: MatchPair[];
  unmatched: UnmatchedPerson[];
  presetId: string;
  timestamp: string;
}
