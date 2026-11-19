# Curriculum

Source of truth: `content/` (TypeScript). It is validated and seeded into Postgres; the app never reads these files at runtime.

## Coverage (validated, seeded)
| Level | Course | Units | Lessons | Exercises |
|---|---|---|---|---|
| A1 | Foundations: Me and My World | 4 | 12 | 59 |
| A2 | Everyday Life: Past, Plans and Travel | 3 | 9 | 41 |
| B1 | Work, Career and Opinions | 3 | 9 | 43 |
| B2 | Business and Startups | 3 | 9 | 41 |
| C1 | Precision and Academic Argument | 2 | 6 | 30 |
| **Total** | 5 courses | **15** | **45** | **214** |

Plus 18 grammar topics (A1–C1, bilingual rules, examples, common Hebrew-speaker mistakes), 117 vocabulary entries,
24 listening materials (14 lesson clips + 10 placement clips) and 53 placement items.

**C2 has no content yet.** Placement results are capped at C1 and the UI says so.

## Exercise types
multiple choice, listening MC, reading MC, identify the error, fill in the blank, reorder words, correct the sentence,
rewrite, translate Hebrew→English, write a sentence with target words, dictation, speaking prompt, free writing.

## Validation pipeline (`npm run content:validate`)
Errors block seeding:
- zod schema for every entity; duplicate slugs; unknown references (grammar, vocabulary, listening, prerequisites); prerequisite cycles
- every exercise has a Hebrew explanation; level alignment between units and referenced content
- multiple choice: key exists, no duplicate/ambiguous options
- fill-blank: number of `___` equals number of answer groups
- reorder: tokens match the sentence and are not already in order
- dictation: accepted answer matches the transcript segment
- write-sentence: the sample answer contains the required words
- placement bank coverage per skill and level
Warnings (non-blocking) currently: 3 vocabulary examples use an inflected form of a phrasal verb.

## Adding content
1. Add or edit a course in `content/courses/*.ts` using the helpers in `content/dsl.ts`.
2. `npm run content:validate` until there are 0 errors.
3. `npm run content:seed` (idempotent; removed items are retired, not deleted, so history is kept).
4. Optional: `npm run content:generate` creates AI drafts in `content/drafts/` that pass the same validator; a human must
   review and move them into a course file.

## Placement test
Adaptive: starts at B1, chooses items near the current ability estimate with skill balancing, stops after 22–30 items
when the estimate is stable (sd < 0.55) and every skill has ≥5 answers. Results show an overall CEFR-aligned estimate,
per-skill estimates, a confidence label (or "not enough data"), and a clear note that this is not an official certificate.
Speaking and writing are not part of the test.
