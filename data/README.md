# Country knowledge and provenance

`countries.json` is the original visual-clue authoring source. `curation.json` holds reviewed region conventions, visual-feature membership, band counts, and story exceptions. `catalog.json` is the derived, source-attributed runtime catalog consumed through the typed adapter. Edit authoritative inputs, then regenerate; do not hand-edit both copies of a fact.

```sh
npm run data:fetch   # caches source documents locally; network required
npm run data:build   # derives catalog and provenance
npm run test:unit    # validates cross-record and learning invariants
```

Sources are linked on country profiles. The archived World Factbook text is public domain and pinned to commit `144d6977b2b01ac1cbd220de754c0a005616760b` of `factbook/factbook.json`. Country metadata is from mledoze/countries (ODbL; license in assets/licenses). Civil time-zone identifiers are from IANA tzdb 2026d. Physical continent outlines come from Natural Earth (public domain). Raw fetched caches live in ignored `data/sources/`; compact derived data is committed for offline builds.

## Decisions that prevent misleading lessons

- Türkiye, Russia, Kazakhstan and Egypt span continents; Indonesia's western New Guinea territory is included in Oceania. Regions are arrays, not a forced single answer.
- Cyprus and Caucasus classifications can vary by convention. Explicit `regionMode: convention` is distinct from physically spanning an agreed boundary. Their valid alternative grouping must never be a wrong answer.
- Continent badges describe core/mainland territories; overseas exceptions are explained separately. Border profiles can include overseas land connections, such as France–Brazil.
- Country statistical groupings must not paint all of Russia as physical Europe; maps use continent geometry rather than blindly filling countries by a single region field.
- Visual features are reviewed lists, not a regex over prose. “No star” must never classify Mali as a star flag.
- Band counts include thin background bands, but not emblem detail. Botswana has five; Afghanistan's white flag does not have two.
- The Ashoka Chakra is not Gandhi's spinning wheel. Mnemonics are explicitly separate from flag history.
- Afghanistan's archived Factbook flag description refers to a different historical flag and is overridden with a source matching the displayed de facto flag. Syria's current flag and evolving interpretations are labeled.
- The source's one-sided Sri Lanka→India adjacency is excluded, not silently converted into a land border. Adam's Bridge does not create a present-day land border.
- Religious context lists traditions from a dated source snapshot; percentages are removed rather than represented as current demographic truth. Every person can have a different belief or none. This is not a religion-identification game.
- Languages are selected source listings, not exhaustive claims about all residents.
- Time-zone proximity uses actual UTC offsets at an explicit instant, including DST and 15/30/45-minute offsets; it is not inferred from longitude. A multi-zone country may match through any listed zone.

Future geography topics should add sourced content and domain-specific relations to shared contracts and registries, not copy a country screen and invent data to fill it.
