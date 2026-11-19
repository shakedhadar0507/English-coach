"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, Send, Square, Volume2 } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { Badge, Button, Card, En, Notice, Spinner, cn } from "@/components/ui";
import { listen, speak, stopSpeaking, sttSupported, ttsSupported, type Accent, type Recognizer } from "@/lib/client/speech";
import { postOrQueue } from "@/lib/client/offline-queue";
import { newId } from "@/lib/client/use-active-time";

const MODES = ["free_talk", "role_play", "guided", "interview"] as const;
const SCENARIOS = ["job_interview", "business_meeting", "investor_pitch", "restaurant", "hotel", "airport", "travel", "customer", "university", "new_people", "business_idea"] as const;

interface Turn { role: "user" | "tutor"; text: string; correction?: { original: string; corrected: string; explanation: string } | null }
interface Feedback {
  summary: string; new_vocabulary: { term: string; meaning_he: string; example: string }[];
  grammar_errors: { original: string; corrected: string; explanation: string }[];
  natural_alternatives: { original: string; better: string; why: string }[]; suggested_practice: string[];
}
interface HistoryRow { id: string; mode: string; scenario: string | null; topic: string | null; turns: number; date: string; feedback: Feedback | null }

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}

export function SpeakCoach({ planItemId, accent, voiceRate, correctionMode, aiTutor, realtime, history }: {
  planItemId: string | null; accent: Accent; voiceRate: number; correctionMode: "immediate" | "end_of_conversation"; aiTutor: boolean; realtime: boolean; history: HistoryRow[];
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [mode, setMode] = useState<(typeof MODES)[number]>("free_talk");
  const [scenario, setScenario] = useState<(typeof SCENARIOS)[number]>("job_interview");
  const [topic, setTopic] = useState("");
  const [correction, setCorrection] = useState(correctionMode);
  const [transport, setTransport] = useState<"turn_based" | "text">("turn_based");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [state, setState] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [interim, setInterim] = useState("");
  const [typed, setTyped] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [ending, setEnding] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const recRef = useRef<Recognizer | null>(null);
  const seqRef = useRef(0);
  const endRef = useRef<HTMLDivElement>(null);
  const [stt, setStt] = useState(true);

  useEffect(() => { setStt(sttSupported()); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [turns, interim]);
  useEffect(() => () => { recRef.current?.abort(); stopSpeaking(); }, []);

  const statusText = (s: string) => s === "budget_exceeded" ? t.common.budgetExceeded : s === "ai_disabled" ? t.common.aiDisabled : t.common.error;

  async function say(text: string) {
    if (transport !== "turn_based" || !ttsSupported()) return;
    setState("speaking");
    try { await speak(text, { accent, rate: voiceRate }); } catch { /* no voice */ }
    setState("idle");
  }

  async function start() {
    setNotice(null);
    setState("thinking");
    try {
      const d = await post<{ conversation: { id: string }; opener: { status: string; reply?: string } }>("/api/tutor/start",
        { mode, scenario: mode === "role_play" || mode === "interview" ? scenario : null, topic: topic || null, transport, correctionMode: correction });
      setConversationId(d.conversation.id);
      setTurns([]);
      seqRef.current = 0;
      if (d.opener.status === "ok" && d.opener.reply) {
        setTurns([{ role: "tutor", text: d.opener.reply }]);
        seqRef.current = 1;
        setState("idle");
        say(d.opener.reply);
      } else { setNotice(statusText(d.opener.status)); setState("idle"); }
    } catch { setNotice(t.common.error); setState("idle"); }
  }

  async function send(text: string, speakingSeconds = 0) {
    const clean = text.trim();
    if (!clean || !conversationId) return;
    const seq = seqRef.current;
    setTurns((ts) => [...ts, { role: "user", text: clean }]);
    setState("thinking");
    try {
      const d = await post<{ status: string; reply?: string; correction?: Turn["correction"] }>("/api/tutor/turn", { conversationId, seq, text: clean, speakingSeconds });
      if (d.status === "ok" && d.reply) {
        seqRef.current = seq + 2;
        setTurns((ts) => {
          const copy = [...ts];
          if (d.correction) copy[copy.length - 1] = { ...copy[copy.length - 1], correction: d.correction };
          return [...copy, { role: "tutor", text: d.reply! }];
        });
        setState("idle");
        say(d.reply);
      } else {
        seqRef.current = seq + 1; // the learner turn was stored; the coach reply was not
        setNotice(statusText(d.status));
        setState("idle");
      }
    } catch { setNotice(t.speak.connectionLost); setState("idle"); }
  }

  function talk() {
    if (state === "listening") { recRef.current?.stop(); return; }
    stopSpeaking();
    setNotice(null);
    const startedAt = Date.now();
    try {
      const { recognizer, final } = listen({ accent, onInterim: setInterim });
      recRef.current = recognizer;
      setState("listening");
      final.then((text) => { setInterim(""); setState("idle"); if (text.trim()) send(text, (Date.now() - startedAt) / 1000); })
        .catch((e: unknown) => { setInterim(""); setState("idle"); setNotice(String(e).includes("not-allowed") ? t.speak.micDenied : t.speak.sttUnsupported); });
    } catch { setNotice(t.speak.sttUnsupported); setState("idle"); }
  }

  async function end() {
    if (!conversationId) return;
    recRef.current?.abort(); stopSpeaking();
    setEnding(true);
    try {
      const d = await post<{ status: string; feedback?: Feedback }>("/api/tutor/end", { conversationId });
      if (d.status === "ok" && d.feedback) setFeedback(d.feedback);
      else if (d.status !== "too_short") setNotice(statusText(d.status));
      if (planItemId && turns.filter((x) => x.role === "user").length >= 2) postOrQueue("/api/plan/item", { itemId: planItemId }, newId("pi"));
    } catch { setNotice(t.common.error); }
    setEnding(false);
    setConversationId(null);
    router.refresh();
  }

  // ---------- Setup ----------
  if (!conversationId && !feedback) return (
    <div className="flex flex-col gap-4">
      {!aiTutor && <Notice>{t.common.aiDisabled}</Notice>}
      <Card className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2">
          {MODES.map((m) => (
            <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)}
              className={cn("rounded-xl border p-3 text-start", mode === m ? "border-primary bg-primary-bg" : "border-border bg-surface")}>
              <span className="block font-semibold">{t.speak.modes[m]}</span>
              <span className="block text-xs text-muted">{t.speak.modesDesc[m]}</span>
            </button>
          ))}
        </div>
        {(mode === "role_play" || mode === "interview") && (
          <label className="grid gap-1 text-sm">{t.speak.scenario}
            <select value={scenario} onChange={(e) => setScenario(e.target.value as typeof scenario)} className="min-h-11 rounded-xl border border-border bg-surface px-3">
              {SCENARIOS.map((s) => <option key={s} value={s}>{t.speak.scenarios[s]}</option>)}
            </select>
          </label>
        )}
        {(mode === "free_talk" || mode === "guided") && (
          <label className="grid gap-1 text-sm">{t.speak.topic}
            <input value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={120} placeholder={t.speak.topicPlaceholder} className="min-h-11 rounded-xl border border-border bg-surface px-3" />
          </label>
        )}
        <fieldset className="grid gap-2 text-sm">
          <legend className="mb-1">{t.speak.transport}</legend>
          <div className="grid grid-cols-3 gap-2">
            <Button type="button" variant="secondary" disabled className="px-1 text-xs" title={t.speak.realtimeUnavailable}>{t.speak.transports.realtime}</Button>
            <Button type="button" variant={transport === "turn_based" ? "primary" : "secondary"} className="px-1 text-xs" onClick={() => setTransport("turn_based")}>{t.speak.transports.turn_based}</Button>
            <Button type="button" variant={transport === "text" ? "primary" : "secondary"} className="px-1 text-xs" onClick={() => setTransport("text")}>{t.speak.transports.text}</Button>
          </div>
          {!realtime && <p className="text-xs text-muted">{t.speak.realtimeUnavailable}</p>}
          {transport === "turn_based" && !stt && <p className="text-xs text-warning">{t.speak.sttUnsupported}</p>}
        </fieldset>
        <fieldset className="grid gap-2 text-sm">
          <legend className="mb-1">{t.speak.correction}</legend>
          <div className="grid grid-cols-2 gap-2">
            {(["immediate", "end_of_conversation"] as const).map((c) => (
              <Button key={c} type="button" variant={correction === c ? "primary" : "secondary"} className="px-1 text-xs" onClick={() => setCorrection(c)}>{t.speak.correctionModes[c]}</Button>
            ))}
          </div>
        </fieldset>
        <Button block disabled={!aiTutor || state === "thinking"} onClick={start}>{state === "thinking" ? <Spinner label={t.common.loading} /> : t.speak.start}</Button>
        {notice && <Notice tone="warning">{notice}</Notice>}
        <p className="text-xs text-muted">{t.speak.pronunciationNote}</p>
      </Card>
      {history.length > 0 && (
        <Card className="p-0">
          <h2 className="font-bold px-4 pt-4 pb-2">{t.speak.history}</h2>
          <ul className="divide-y divide-border">
            {history.map((h) => (
              <li key={h.id}>
                <button className="w-full flex items-center justify-between gap-2 px-4 py-3 text-start" aria-expanded={open === h.id} onClick={() => setOpen(open === h.id ? null : h.id)}>
                  <span><span className="block font-medium">{t.speak.modes[h.mode as keyof typeof t.speak.modes]}{h.scenario ? ` · ${t.speak.scenarios[h.scenario as keyof typeof t.speak.scenarios]}` : ""}</span>
                    <span className="block text-xs text-muted">{h.date} · {h.turns}</span></span>
                  {h.feedback && <Badge tone="success">{t.speak.feedbackTitle}</Badge>}
                </button>
                {open === h.id && h.feedback && <div className="px-4 pb-4"><FeedbackView fb={h.feedback} /></div>}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );

  // ---------- Feedback ----------
  if (feedback) return (
    <div className="flex flex-col gap-4">
      <Card><h2 className="font-bold mb-3">{t.speak.feedbackTitle}</h2><FeedbackView fb={feedback} /></Card>
      <Button block onClick={() => { setFeedback(null); setTurns([]); }}>{t.common.done}</Button>
    </div>
  );

  // ---------- Conversation ----------
  return (
    <div className="flex flex-col gap-3">
      <Card className="flex flex-col gap-3 min-h-[50dvh]">
        <ol className="flex flex-col gap-3" aria-live="polite" aria-label={t.speak.transcript}>
          {turns.map((turn, i) => (
            <li key={i} className={cn("max-w-[85%] rounded-2xl px-4 py-2.5", turn.role === "user" ? "self-end bg-primary text-on-primary" : "self-start bg-surface")}>
              <En block>{turn.text}</En>
              {turn.role === "tutor" && transport === "turn_based" && (
                <button className="mt-1 text-muted" aria-label={t.player.listen} onClick={() => say(turn.text)}><Volume2 size={16} /></button>
              )}
              {turn.correction && (
                <div className="mt-2 rounded-xl bg-card text-text p-2 text-sm">
                  <En className="line-through text-danger">{turn.correction.original}</En> → <En className="text-success font-medium">{turn.correction.corrected}</En>
                  <p className="text-muted mt-1">{turn.correction.explanation}</p>
                </div>
              )}
            </li>
          ))}
          {interim && <li className="self-end max-w-[85%] rounded-2xl px-4 py-2.5 bg-primary-bg"><En block>{interim}</En></li>}
          {state === "thinking" && <li className="self-start text-sm text-muted">{t.speak.thinking}</li>}
        </ol>
        <div ref={endRef} />
      </Card>
      {notice && <Notice tone="warning">{notice}</Notice>}
      {transport === "turn_based" && stt ? (
        <div className="flex flex-col items-center gap-2">
          <button onClick={talk} disabled={state === "thinking"} aria-pressed={state === "listening"}
            className={cn("h-20 w-20 rounded-full grid place-items-center text-on-primary shadow-lg disabled:opacity-50", state === "listening" ? "bg-danger animate-pulse" : "bg-primary")}
            aria-label={state === "listening" ? t.player.stop : t.speak.holdToTalk}>
            {state === "listening" ? <Square size={28} /> : <Mic size={32} />}
          </button>
          <p className="text-sm text-muted">{state === "listening" ? t.speak.listening : state === "speaking" ? t.speak.speaking : t.speak.holdToTalk}</p>
          {state === "speaking" && <Button variant="ghost" onClick={() => { stopSpeaking(); setState("idle"); }}>{t.speak.interrupt}</Button>}
        </div>
      ) : null}
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); const v = typed; setTyped(""); send(v); }}>
        <input value={typed} onChange={(e) => setTyped(e.target.value)} dir="ltr" lang="en" maxLength={1500} placeholder={t.speak.typeMessage} aria-label={t.speak.typeMessage}
          className="flex-1 min-h-11 rounded-xl border border-border bg-card px-4 outline-none focus:border-primary" />
        <Button type="submit" disabled={!typed.trim() || state === "thinking"} className="px-4" aria-label={t.speak.send}><Send size={18} /></Button>
      </form>
      <Button variant="secondary" disabled={ending} onClick={end}>{ending ? t.common.loading : t.speak.end}</Button>
    </div>
  );
}

function FeedbackView({ fb }: { fb: Feedback }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-4 text-sm">
      <p className="leading-relaxed">{fb.summary}</p>
      {fb.grammar_errors.length > 0 && <section><h3 className="font-semibold mb-1">{t.speak.grammarErrors}</h3>
        <ul className="flex flex-col gap-2">{fb.grammar_errors.map((g, i) => <li key={i}><En className="line-through text-danger">{g.original}</En> → <En className="text-success font-medium">{g.corrected}</En><p className="text-muted">{g.explanation}</p></li>)}</ul></section>}
      {fb.natural_alternatives.length > 0 && <section><h3 className="font-semibold mb-1">{t.speak.naturalAlternatives}</h3>
        <ul className="flex flex-col gap-2">{fb.natural_alternatives.map((g, i) => <li key={i}><En>{g.original}</En> → <En className="font-medium text-primary">{g.better}</En><p className="text-muted">{g.why}</p></li>)}</ul></section>}
      {fb.new_vocabulary.length > 0 && <section><h3 className="font-semibold mb-1">{t.speak.newVocab}</h3>
        <ul className="flex flex-col gap-1">{fb.new_vocabulary.map((v, i) => <li key={i}><En className="font-medium">{v.term}</En> · {v.meaning_he}<En block className="text-muted">{v.example}</En></li>)}</ul></section>}
      {fb.suggested_practice.length > 0 && <section><h3 className="font-semibold mb-1">{t.speak.suggestedPractice}</h3>
        <ul className="list-disc ps-5">{fb.suggested_practice.map((s, i) => <li key={i}>{s}</li>)}</ul></section>}
      <p className="text-xs text-muted">{t.speak.pronunciationNote}</p>
    </div>
  );
}
