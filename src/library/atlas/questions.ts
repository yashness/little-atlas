import {
  REGIONS,
  type Country,
  type Feature,
  type GameOptions,
  type QuestionResult,
  type Choice,
} from "../../contracts/atlas";
import { shuffled } from "../../utils/collections";
import { clockDistance, regionLabel, regionSentence } from "./geography";
import { similarity, distinguishable, distinctFlagSet } from "./selection";

const FEATURE_NAMES: Record<Feature, string> = {
  circle: "a circle",
  stars: "stars",
  cross: "a cross",
  vertical: "stripes standing up",
  horizontal: "stripes lying down",
  crescent: "a crescent moon",
  sun: "a sun with rays",
  animal: "an animal",
  text: "writing",
  triangle: "a triangle",
  tree: "a tree or leaf",
};
function flagChoice(country: Country, correct: boolean): Choice {
  return {
    id: country.code,
    countryCode: country.code,
    label: country.name,
    correct,
  };
}
export function makeQuestion(
  target: Country,
  pool: readonly Country[],
  options: GameOptions,
  at: Date,
  random: () => number = Math.random,
): QuestionResult {
  const { kind, choices: count } = options;
  if (kind === "pairs")
    return {
      ok: false,
      reason: "Memory pairs use a card board, not a multiple-choice question.",
    };
  if (!pool.some((c) => c.code === target.code))
    return {
      ok: false,
      reason: "The target must belong to the selected country set.",
    };
  const others = pool.filter((c) => c.code !== target.code);
  const question = (
    prompt: string,
    clue: string,
    explanation: string,
    answers: Choice[],
    feature?: Feature,
  ): QuestionResult => ({
    ok: true,
    question: {
      kind,
      targetCode: target.code,
      prompt,
      clue,
      explanation,
      choices: shuffled(answers, random),
      ...(feature ? { feature } : {}),
    },
  });
  if (kind === "places") {
    const wrong = shuffled(
      REGIONS.filter((r) => !target.regions.includes(r)),
      random,
    ).slice(0, count - 1);
    return question(
      `Where is ${target.name}?`,
      regionSentence(target),
      regionSentence(target),
      [
        {
          id: "home",
          label: regionLabel(target),
          regions: target.regions,
          correct: true,
        },
        ...wrong.map((r) => ({
          id: r,
          label: r,
          regions: [r],
          correct: false,
        })),
      ],
    );
  }
  if (kind === "flags") {
    const eligible = others
      .filter((c) => distinguishable(target, c))
      .sort((a, b) => similarity(target, b) - similarity(target, a));
    if (eligible.length < count - 1)
      return {
        ok: false,
        reason: `Choose more countries for ${count} fair flag choices. Near-identical flags are compared in lessons, not marked wrong here.`,
      };
    const wrong = (
      options.choices === 2 ? shuffled(eligible, random) : eligible
    ).slice(0, count - 1);
    return question(
      `Can you find ${target.name}?`,
      target.clue,
      `${target.name}! ${target.clue}`,
      [flagChoice(target, true), ...wrong.map((c) => flagChoice(c, false))],
    );
  }
  if (kind === "shapes") {
    const feature = shuffled(target.features, random).find(
      (f) => others.filter((c) => !c.features.includes(f)).length >= count - 1,
    );
    if (!feature)
      return {
        ok: false,
        reason:
          "These flags do not have enough contrasting features. Broaden the country set or try Flag detective.",
      };
    const wrong = shuffled(
      others.filter((c) => !c.features.includes(feature)),
      random,
    ).slice(0, count - 1);
    return question(
      `Can you spot ${FEATURE_NAMES[feature]}?`,
      `Look for ${FEATURE_NAMES[feature]} in the flag.`,
      `${target.name} has ${FEATURE_NAMES[feature]}.`,
      [flagChoice(target, true), ...wrong.map((c) => flagChoice(c, false))],
      feature,
    );
  }
  const isMatch = (country: Country): boolean =>
    kind === "neighbors"
      ? target.borderCodes.includes(country.code)
      : (clockDistance(target, country, at) ?? Infinity) <= 60;
  const right = shuffled(others.filter(isMatch), random)[0];
  const wrong = shuffled(
    others.filter(
      (c) =>
        !isMatch(c) &&
        (kind !== "neighbors" ||
          !target.uncertainBorderCodes.includes(c.code)) &&
        (kind !== "clocks" || clockDistance(target, c, at) !== null),
    ),
    random,
  ).slice(0, count - 1);
  if (!right || wrong.length < count - 1)
    return {
      ok: false,
      reason:
        kind === "neighbors"
          ? "This set needs a listed land neighbor and enough non-neighbors. Islands without land borders are not given imaginary neighbors."
          : "This set needs countries both inside and outside the one-hour clock window. Try a broader selection.",
    };
  return kind === "neighbors"
    ? question(
        `Who shares a land border with ${target.name}?`,
        "A land border is where two countries touch on land.",
        `${right.name} and ${target.name} share a listed land border. ${target.borderNote}`,
        [flagChoice(right, true), ...wrong.map((c) => flagChoice(c, false))],
      )
    : question(
        `Who has a nearby clock to ${target.name}?`,
        "Find a country with at least one UTC offset within one hour, today.",
        `${right.name} has a time zone ${clockDistance(target, right, at)} minute(s) from a zone in ${target.name} today. Summer-time changes are included.`,
        [flagChoice(right, true), ...wrong.map((c) => flagChoice(c, false))],
      );
}
export function eligibleTargets(
  pool: readonly Country[],
  options: GameOptions,
  at: Date,
): Country[] {
  if (options.kind === "pairs") {
    const distinct = distinctFlagSet(pool);
    return distinct.length >= options.choices + 1 ? distinct : [];
  }
  return pool.filter(
    (target) => makeQuestion(target, pool, options, at, () => 0.5).ok,
  );
}
