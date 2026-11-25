import companies from "../data/companies.json";
import { DatasetRepository } from "./engine.ts";
import type { Company } from "./types.ts";

export const dataset = new DatasetRepository((companies as { items: Company[] }).items);
