import type { Country, Question } from "../../contracts/atlas";
import { regionSentence } from "./geography";

export const countryCue = (
  country: Country,
  kind: "learn" | "flag" | "story",
): string => `${kind}-${country.code}`;
export function questionCues(
  question: Question,
  country: Country,
  hint: boolean,
): string[] {
  if (!hint) return [`game-${question.kind}`];
  if (question.kind === "flags") return [countryCue(country, "flag")];
  if (question.kind === "shapes") {
    if (!question.feature)
      throw new Error(
        "A shape question needs an explicit feature, not a guessed narration.",
      );
    return [`feature-${question.feature}`];
  }
  if (question.kind === "places")
    return country.regionMode === "single"
      ? [`region-${country.regions[0]!.toLowerCase().replaceAll(" ", "-")}`]
      : [`home-multi-${country.code}`];
  return [`game-${question.kind}`];
}

/** Shared recording contract. The browser and generation tooling use these IDs. */
export function narrationEntries(
  catalog: readonly Country[],
): Record<string, string> {
  const entries: Record<string, string> = {
    welcome: "Hello, little explorer! I’m Pip. Let’s meet a new country.",
    found: "You found it! What a wonderful little explorer.",
    retry: "A good try! Let’s have another little look.",
    stamp:
      "Hello, world! You found a country’s flag, and its home. A happy little memory for your passport!",
    "complete-game":
      "Look at all your little discoveries! You noticed, you remembered, and you tried again. What a wonderful explorer.",
    "game-flags":
      "Look at the country’s name, and find its flag. Take your time. You can ask for a clue.",
    "game-shapes":
      "Look for the shape in the question. Which flag has it? You can ask for a clue.",
    "game-places":
      "Where is this country’s home? Look at the region names and maps. A country can belong to more than one.",
    "game-neighbors":
      "Which country shares a land border with the place above? A land border is where two countries touch on land, not across the sea.",
    "game-clocks":
      "Which country has a nearby clock? Find one with a time zone within one hour of the place above, today. Some countries have more than one clock.",
    "game-pairs":
      "Turn over two postcards and look at their flags. Can you find a matching pair? If they are different, take a look, then turn them back and try again.",
  };
  for (const c of catalog) {
    entries[countryCue(c, "learn")] =
      `Hello, ${c.name}! ${c.clue} ${c.geography}`;
    entries[countryCue(c, "flag")] =
      `Can you find the flag of ${c.name}? ${c.clue}`;
    entries[countryCue(c, "story")] = `${c.name}. ${c.story.summary}`;
    if (c.regionMode !== "single")
      entries[`home-multi-${c.code}`] = regionSentence(c);
  }
  const features = {
    circle: "a circle",
    stars: "stars",
    cross: "a cross",
    vertical: "stripes standing up",
    horizontal: "stripes lying down",
    crescent: "a crescent moon",
    sun: "a sun with rays",
    animal: "an animal",
    text: "writing",
    tree: "a tree or a leaf",
    triangle: "a triangle",
  };
  for (const [feature, text] of Object.entries(features))
    entries[`feature-${feature}`] =
      `Look for ${text} in the flag. Take your time.`;
  for (const region of [
    "Asia",
    "Europe",
    "Africa",
    "North America",
    "South America",
    "Oceania",
  ])
    entries[`region-${region.toLowerCase().replaceAll(" ", "-")}`] =
      `${region}! Look for ${region} on the map. Take your time.`;
  return entries;
}
