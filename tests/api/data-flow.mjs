// Export + delete API check against a running server with the E2E owner (see docs/TESTING.md).
const B = "http://localhost:3100"; let cookie = "";
async function call(path, body, method = "POST") {
  const r = await fetch(B + path, { method, headers: { "content-type": "application/json", cookie, origin: B }, body: body ? JSON.stringify(body) : undefined });
  const sc = r.headers.getSetCookie?.() ?? []; if (sc.length) cookie = sc.map((c) => c.split(";")[0]).join("; ");
  return r;
}
await call("/api/auth/sign-in/email", { email: "owner@example.com", password: "TestPassword123" });
const ex = await call("/api/data/export", null, "GET"); const j = await ex.json();
console.log("export", ex.status, ex.headers.get("content-disposition"), Object.keys(j.data).length, "tables; attempts:", j.data.exercise_attempts.length, "keys leaked:", JSON.stringify(j).includes("exercise_keys"));
console.log("delete w/o confirm", (await call("/api/data/delete", {})).status);
console.log("delete", (await call("/api/data/delete", { confirm: "DELETE" })).status);
const ex2 = await (await call("/api/data/export", null, "GET")).json();
console.log("after delete attempts:", ex2.data.exercise_attempts.length, "vocab:", ex2.data.user_vocabulary.length, "onboarded:", ex2.data.profile[0].onboarded_at);
const home = await fetch(B + "/", { headers: { cookie }, redirect: "manual" }); console.log("home redirects to", home.headers.get("location"));
