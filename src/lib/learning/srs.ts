import { createEmptyCard, fsrs, Rating, State, type Card, type Grade } from "ts-fsrs";

/**
 * FSRS scheduling (ts-fsrs). The DB stores the card fields; this module turns a
 * review outcome into the next card state. Pure and deterministic (no fuzz) so
 * results are reproducible and auditable.
 */
const scheduler = fsrs({ enable_fuzz: false, enable_short_term: true, request_retention: 0.9, maximum_interval: 365 });

export interface CardState {
  due: string; stability: number; difficulty: number; scheduled_days: number; learning_steps: number;
  reps: number; lapses: number; fsrs_state: number; last_review: string | null;
}

export type ReviewDirection = "recognition" | "production";

export function newCardState(now: Date): CardState {
  return toState(createEmptyCard(now));
}

function toCard(s: CardState): Card {
  return {
    due: new Date(s.due), stability: s.stability, difficulty: s.difficulty,
    elapsed_days: 0, scheduled_days: s.scheduled_days, learning_steps: s.learning_steps,
    reps: s.reps, lapses: s.lapses, state: s.fsrs_state as State,
    last_review: s.last_review ? new Date(s.last_review) : undefined,
  } as Card;
}

function toState(c: Card): CardState {
  return {
    due: c.due.toISOString(), stability: round(c.stability), difficulty: round(c.difficulty),
    scheduled_days: c.scheduled_days, learning_steps: c.learning_steps ?? 0, reps: c.reps, lapses: c.lapses,
    fsrs_state: c.state, last_review: c.last_review ? new Date(c.last_review).toISOString() : null,
  };
}

const round = (n: number) => Math.round(n * 1e6) / 1e6;

/**
 * Derives an FSRS grade from an exercise outcome. Recognizing a translation is
 * weaker evidence than producing the word, so a correct recognition is rated
 * "Hard" for cards already in review; production earns "Good" (or "Easy" when fast).
 */
export function gradeFromOutcome(o: { correct: boolean; direction: ReviewDirection; typo?: boolean; fast?: boolean; fsrsState: number }): Grade {
  if (!o.correct) return Rating.Again;
  if (o.typo) return Rating.Hard;
  if (o.direction === "recognition") return o.fsrsState === State.Review ? Rating.Hard : Rating.Good;
  return o.fast ? Rating.Easy : Rating.Good;
}

export function review(state: CardState, grade: Grade, now: Date): CardState {
  const result = scheduler.next(toCard(state), now, grade);
  return toState(result.card);
}

export function retrievability(state: CardState, now: Date): number {
  if (state.fsrs_state === State.New) return 0;
  return scheduler.retrievability(toCard(state), now);
}

export { Rating, State };
