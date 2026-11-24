// 計算の結果を画面に出すときの見せ方だけを決める。計算の値は変えない。
import type { Company } from "./types.ts";

/**
 * 称号を「前置き（accent の小さな文字）」と「本体」に分ける。
 * Framer の結果画面は「実は非上場！」と「表舞台 × 裏の実力者ギャップペア」を分けて置き、先頭の絵文字を出さない。
 * 「！」で終わるだけの称号は分けずに本体だけにする。
 */
export function splitTitle(title: string): { kicker: string | null; body: string } {
  const text = title.replace(/^[^\p{L}\p{N}「]+/u, "").trim();
  const idx = text.indexOf("！");
  if (idx >= 0 && idx < text.length - 1) {
    return { kicker: text.slice(0, idx + 1), body: text.slice(idx + 1).trim() };
  }
  return { kicker: null, body: text };
}

/** 発動トリガーの表示名。Framer の表記に合わせ、半角の括弧を全角にする。 */
export function tagLabel(tag: string): string {
  return tag.replace(/\(/g, "（").replace(/\)/g, "）");
}

export type TagIcon = "Sparkle" | "Heart" | "Intersect";

/** Framer の結果画面の対応: お題のトリガー=Sparkle、非上場=Heart、同い年創業=Intersect。ほかは Intersect に寄せる。 */
export function tagIcon(tag: string, themeTagLabel: string): TagIcon {
  if (tag === themeTagLabel) return "Sparkle";
  if (tag.includes("非上場")) return "Heart";
  return "Intersect";
}

export function companyMeta(company: Company): string {
  return `${company.metrics.founded_year}年創業 / ${company.industry} / ${company.metrics.is_listed ? "上場" : "非上場"}`;
}

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}
