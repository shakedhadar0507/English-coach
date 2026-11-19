// Verifies AI features end-to-end against tests/ai/mock-provider.mjs (no real provider, $0). See docs/TESTING.md.
const B = "http://localhost:3101";
let cookie = "";
async function call(path, body, method = "POST") {
  const r = await fetch(B + path, { method, headers: { "content-type": "application/json", cookie, origin: B }, body: body ? JSON.stringify(body) : undefined });
  const sc = r.headers.getSetCookie?.() ?? []; if (sc.length) cookie = sc.map((c) => c.split(";")[0]).join("; ");
  const t = await r.text(); try { return { s: r.status, j: JSON.parse(t) }; } catch { return { s: r.status, t: t.slice(0, 100) }; }
}
console.log("login", (await call("/api/auth/sign-in/email", { email: "owner@example.com", password: "TestPassword123" })).s);
await call("/api/level", { level: "B1" });
const w = await call("/api/writing", { taskPrompt: "Describe your weekend", body: "Yesterday I go to the beach with friends and it was great.", clientSubmissionId: "wtest00001" });
console.log("writing", w.s, w.j.status, "issues:", w.j.feedback?.issues?.length, w.j.feedback?.issues?.map((i) => i.original));
const st = await call("/api/tutor/start", { mode: "free_talk", topic: "running", transport: "text" });
console.log("tutor start", st.s, st.j.opener);
const id = st.j.conversation.id;
const t1 = await call("/api/tutor/turn", { conversationId: id, seq: 1, text: "Hi, I goes running every morning." });
console.log("turn1", t1.s, t1.j);
const dup = await call("/api/tutor/turn", { conversationId: id, seq: 1, text: "Hi, I goes running every morning." });
console.log("turn1 retry (idempotent)", dup.s, dup.j.reply === t1.j.reply);
const t2 = await call("/api/tutor/turn", { conversationId: id, seq: 3, text: "I am a student and I manage a community." });
console.log("turn2", t2.s, t2.j.status);
const end = await call("/api/tutor/end", { conversationId: id });
console.log("end", end.s, end.j.status, "errors:", end.j.feedback?.grammar_errors?.map((g) => g.original));
const prog = await call("/api/preferences", { monthly_ai_budget_usd: 0 });
console.log("set budget 0", prog.s);
const w2 = await call("/api/writing", { taskPrompt: "x", body: "I like running a lot.", clientSubmissionId: "wtest00002" });
console.log("writing with $0 budget ->", w2.j.status);
const cross = await fetch(B + "/api/preferences", { method: "POST", headers: { "content-type": "application/json", cookie, origin: "https://evil.example" }, body: "{}" });
console.log("cross-origin write ->", cross.status);
const over = await call("/api/preferences", { monthly_ai_budget_usd: 100 });
console.log("budget above $15 cap ->", over.s);
await call("/api/preferences", { monthly_ai_budget_usd: 15 });
