import raw from "../../data/catalog.json";
import { REGIONS, type Country, type Region } from "../contracts/atlas";

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const strings = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");
const source = (value: unknown): boolean =>
  record(value) &&
  typeof value["label"] === "string" &&
  typeof value["snapshot"] === "string" &&
  typeof value["url"] === "string" &&
  value["url"].startsWith("https://");

/** External data fails here, not half-way through a child's lesson. */
export function parseCatalog(value: unknown): Country[] {
  if (!Array.isArray(value))
    throw new Error("Country catalog must be an array.");
  const seen = new Set<string>();
  for (const c of value) {
    if (
      !record(c) ||
      typeof c["code"] !== "string" ||
      !/^[a-z]{2}$/.test(c["code"]) ||
      seen.has(c["code"])
    )
      throw new Error("Country codes must be unique two-letter identifiers.");
    seen.add(c["code"]);
    const fail = (field: string): never => {
      throw new Error(`Invalid ${field}: ${c["code"]}`);
    };
    for (const key of [
      "name",
      "mapId",
      "geography",
      "visualTitle",
      "mnemonic",
      "clue",
      "compareWith",
      "shape",
      "regionNote",
      "borderNote",
    ])
      if (typeof c[key] !== "string") fail(key);
    for (const key of [
      "colors",
      "features",
      "borderCodes",
      "uncertainBorderCodes",
      "timeZones",
    ])
      if (!strings(c[key])) fail(key);
    if (
      !strings(c["regions"]) ||
      !c["regions"].length ||
      !c["regions"].every((r) => REGIONS.includes(r as Region))
    )
      fail("regions");
    if (!["single", "spans", "convention"].includes(String(c["regionMode"])))
      fail("region convention");
    if (!["member", "observer", "additional"].includes(String(c["scope"])))
      fail("status");
    if (
      c["bands"] !== null &&
      (!Number.isInteger(c["bands"]) || Number(c["bands"]) < 2)
    )
      fail("bands");
    const point = c["coordinates"];
    if (
      !Array.isArray(point) ||
      point.length !== 2 ||
      !point.every(Number.isFinite) ||
      Math.abs(Number(point[0])) > 180 ||
      Math.abs(Number(point[1])) > 90
    )
      fail("map pin");
    if (
      !Array.isArray(c["languages"]) ||
      !c["languages"].length ||
      !c["languages"].every(
        (l) =>
          record(l) &&
          typeof l["code"] === "string" &&
          typeof l["name"] === "string",
      )
    )
      fail("languages");
    if (
      !Array.isArray(c["sources"]) ||
      !c["sources"].length ||
      !c["sources"].every(source)
    )
      fail("sources");
    const story = c["story"];
    if (
      !record(story) ||
      typeof story["summary"] !== "string" ||
      typeof story["detail"] !== "string" ||
      !source(story["source"]) ||
      (story["note"] !== undefined && typeof story["note"] !== "string")
    )
      fail("flag story");
    const beliefs = c["beliefs"];
    if (
      beliefs !== null &&
      (!record(beliefs) ||
        typeof beliefs["text"] !== "string" ||
        typeof beliefs["note"] !== "string" ||
        !source(beliefs["source"]))
    )
      fail("belief source note");
  }
  // Cross-country and semantic invariants are audited in the shared-library tests.
  return value as Country[];
}
export const COUNTRIES = parseCatalog(raw);
export const BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c]));
export function country(code: string): Country {
  const result = BY_CODE.get(code);
  if (!result) throw new Error(`Unknown country: ${code}`);
  return result;
}
