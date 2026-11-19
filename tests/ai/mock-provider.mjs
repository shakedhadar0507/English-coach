// Fake OpenAI-compatible provider for tests. Returns canned JSON, including one invented issue that grounding must drop.
import http from "node:http";
http.createServer(async (req, res) => {
  let body = ""; for await (const c of req) body += c;
  const j = JSON.parse(body || "{}");
  const sys = j.messages?.[0]?.content ?? "";
  let content;
  if (sys.includes("writing tutor")) content = { corrected_text: "Yesterday I went to the beach.", summary: "טקסט טוב עם טעות אחת בזמן עבר.", issues: [
    { type: "error", original: "I go to the beach", suggestion: "I went to the beach", explanation: "בעבר משתמשים ב־went.", grammar_topic: "past-simple", category: "verb tense" },
    { type: "error", original: "INVENTED TEXT", suggestion: "x", explanation: "invented", grammar_topic: null, category: "x" }], strengths: ["ברור"], follow_up: null };
  else if (sys.includes("review a spoken English")) content = { summary: "שיחה טובה.", new_vocabulary: [{ term: "commute", meaning_he: "נסיעה לעבודה", example: "My commute is long." }],
    grammar_errors: [{ original: "I goes", corrected: "I go", explanation: "בגוף ראשון בלי s.", grammar_topic: "present-simple" }, { original: "NOT SAID", corrected: "x", explanation: "x", grammar_topic: null }], natural_alternatives: [], suggested_practice: ["תרגל הווה פשוט"] };
  else content = { reply: "Nice to meet you! What do you do for work?", correction: null };
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify({ choices: [{ message: { content: JSON.stringify(content) } }], usage: { prompt_tokens: 500, completion_tokens: 120 } }));
}).listen(3199, () => console.log("mock ai on 3199"));
