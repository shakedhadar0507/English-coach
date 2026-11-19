import { describe, expect, it } from "vitest";
import { gradeExercise } from "@/lib/learning/grading";
import { normalizeAnswer } from "@/lib/learning/normalize";

describe("normalizeAnswer", () => {
  it("expands contractions and strips punctuation/case", () => {
    expect(normalizeAnswer("I'm  working!")).toBe("i am working");
    expect(normalizeAnswer("He doesn’t like it.")).toBe("he does not like it");
    expect(normalizeAnswer("I can't")).toBe(normalizeAnswer("I cannot"));
    expect(normalizeAnswer("It's late")).toBe("it is late");
    expect(normalizeAnswer("We won't go")).toBe("we will not go");
  });
});

describe("gradeExercise", () => {
  it("grades multiple choice", () => {
    expect(gradeExercise("multiple_choice", { correct: ["b"] }, { kind: "choice", selected: ["b"] }).isCorrect).toBe(true);
    expect(gradeExercise("multiple_choice", { correct: ["b"] }, { kind: "choice", selected: ["a"] }).isCorrect).toBe(false);
    expect(gradeExercise("multiple_choice", { correct: ["a", "c"] }, { kind: "choice", selected: ["c", "a"] }).isCorrect).toBe(true);
    expect(gradeExercise("multiple_choice", { correct: ["a", "c"] }, { kind: "choice", selected: ["a"] }).isCorrect).toBe(false);
  });

  it("grades blanks with alternatives and partial credit", () => {
    const key = { blanks: [["had"], ["started", "begun"]] };
    const ok = gradeExercise("fill_blank", key, { kind: "blanks", values: ["had", "begun"] });
    expect(ok.isCorrect).toBe(true);
    const half = gradeExercise("fill_blank", key, { kind: "blanks", values: ["had", "start"] });
    expect(half.isCorrect).toBe(false);
    expect(half.score).toBe(0.5);
    expect(half.blanks).toEqual([true, false]);
  });

  it("accepts contracted and full forms equally", () => {
    const key = { blanks: [["doesn't", "does not"]] };
    expect(gradeExercise("fill_blank", key, { kind: "blanks", values: ["Does not"] }).isCorrect).toBe(true);
    expect(gradeExercise("fill_blank", { blanks: [["am working"]] }, { kind: "blanks", values: ["'m working"] }).isCorrect).toBe(false);
  });

  it("accepts any listed alternative translation", () => {
    const key = { accepted: ["I usually have breakfast at seven.", "I usually eat breakfast at seven."] };
    const r = gradeExercise("translate_he_en", key, { kind: "text", value: "i usually eat breakfast at seven" });
    expect(r.isCorrect).toBe(true);
    expect(r.note).toBe("alternative");
  });

  it("does not accept typos in grammar answers", () => {
    const r = gradeExercise("correct_sentence", { accepted: ["She went home."] }, { kind: "text", value: "She want home." });
    expect(r.isCorrect).toBe(false);
  });

  it("tolerates one-letter typos only when allowed (vocabulary production)", () => {
    const key = { accepted: ["deadline"] };
    expect(gradeExercise("translate_he_en", key, { kind: "text", value: "dedline" }, { allowTypos: true }).verdict).toBe("almost");
    expect(gradeExercise("translate_he_en", key, { kind: "text", value: "dedline" }).verdict).toBe("incorrect");
  });

  it("grades reorder by joining tokens", () => {
    const r = gradeExercise("reorder", { accepted: ["My brother is a doctor."] }, { kind: "tokens", order: ["My", "brother", "is", "a", "doctor"] });
    expect(r.isCorrect).toBe(true);
  });

  it("flags open sentences for review when required words are present", () => {
    const key = { accepted: [], required_words: ["usually"] };
    expect(gradeExercise("write_sentence", key, { kind: "text", value: "I usually run." }).verdict).toBe("needs_review");
    const miss = gradeExercise("write_sentence", key, { kind: "text", value: "I run." });
    expect(miss.verdict).toBe("incorrect");
    expect(miss.missingWords).toEqual(["usually"]);
  });

  it("treats empty answers as incorrect", () => {
    expect(gradeExercise("translate_he_en", { accepted: ["Hi."] }, { kind: "text", value: "   " }).isCorrect).toBe(false);
  });

  it("refuses non-deterministic types", () => {
    expect(() => gradeExercise("free_writing", { accepted: [] }, { kind: "text", value: "x" })).toThrow();
  });
});
