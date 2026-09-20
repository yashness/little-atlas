import type { Progress } from "../../contracts/atlas";
const KEY = "little-atlas-v1"; // Preserve existing learners’ stamps through the typed migration.
export function loadProgress(validCodes: ReadonlySet<string>): Progress {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!value || typeof value !== "object") return { stars: 0, stamps: [] };
    const data = value as Record<string, unknown>;
    return {
      stars:
        typeof data["stars"] === "number" &&
        Number.isSafeInteger(data["stars"]) &&
        data["stars"] >= 0
          ? data["stars"]
          : 0,
      stamps: Array.isArray(data["stamps"])
        ? [
            ...new Set(
              data["stamps"].filter(
                (c): c is string => typeof c === "string" && validCodes.has(c),
              ),
            ),
          ]
        : [],
    };
  } catch {
    return { stars: 0, stamps: [] };
  }
}
export function saveProgress(progress: Progress): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}
