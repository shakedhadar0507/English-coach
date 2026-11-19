import { z } from "zod";

/** Strict schemas for AI output. Anything that does not validate is rejected. */

export const WritingIssue = z.object({
  type: z.enum(["error", "unnatural", "alternative", "style"]),
  original: z.string().min(1).max(400),
  suggestion: z.string().max(400),
  explanation: z.string().min(1).max(600),
  grammar_topic: z.string().max(60).nullable().optional(),
  category: z.string().max(60).default("general"),
});

export const WritingFeedback = z.object({
  corrected_text: z.string().max(10_000),
  summary: z.string().max(800),
  issues: z.array(WritingIssue).max(30),
  strengths: z.array(z.string().max(200)).max(5).default([]),
  follow_up: z.object({ instruction: z.string().max(300), example: z.string().max(300) }).nullable().optional(),
});
export type WritingFeedback = z.infer<typeof WritingFeedback>;

export const TutorReply = z.object({
  reply: z.string().min(1).max(700),
  correction: z.object({ original: z.string().max(300), corrected: z.string().max(300), explanation: z.string().max(400) }).nullable().optional(),
  ended: z.boolean().optional(),
});
export type TutorReply = z.infer<typeof TutorReply>;

export const ConversationFeedback = z.object({
  summary: z.string().max(800),
  new_vocabulary: z.array(z.object({ term: z.string().max(60), meaning_he: z.string().max(120), example: z.string().max(200) })).max(12),
  grammar_errors: z.array(z.object({ original: z.string().max(300), corrected: z.string().max(300), explanation: z.string().max(400), grammar_topic: z.string().max(60).nullable().optional() })).max(10),
  natural_alternatives: z.array(z.object({ original: z.string().max(300), better: z.string().max(300), why: z.string().max(300) })).max(10),
  suggested_practice: z.array(z.string().max(200)).max(5),
});
export type ConversationFeedback = z.infer<typeof ConversationFeedback>;

/** Removes issues that quote text not present in the learner's submission (prevents invented mistakes). */
export function groundIssues(text: string, fb: WritingFeedback): WritingFeedback {
  const norm = (s: string) => s.toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, " ").trim();
  const hay = norm(text);
  return { ...fb, issues: fb.issues.filter((i) => hay.includes(norm(i.original)) && norm(i.original) !== norm(i.suggestion)) };
}
