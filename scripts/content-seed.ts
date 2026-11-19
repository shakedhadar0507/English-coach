/**
 * Validates the curriculum bundle and loads it into Postgres idempotently.
 * Refuses to seed if validation reports any error. Content removed from the
 * bundle is retired (not deleted) so historical attempts stay intact.
 *
 * Usage: DATABASE_URL=... npx tsx scripts/content-seed.ts [--label=v2026.11.19]
 */
import { Client } from "pg";
import { bundle, categories, levels } from "../content";
import { validateBundle } from "../content/validate";
import type { Exercise } from "../content/schema";

export async function seedContent(connectionString: string, label?: string, log = console.log) {
  const { issues, checksum, counts, parsed } = validateBundle(bundle);
  const errors = issues.filter((i) => i.severity === "error");
  if (errors.length) throw new Error(`Content validation failed with ${errors.length} errors; run npm run content:validate`);

  const client = new Client({ connectionString });
  await client.connect();
  const q = (sql: string, params: unknown[] = []) => client.query(sql, params);
  try {
    await q("begin");
    const existing = await q("select id from public.content_versions where checksum = $1", [checksum]);
    if (existing.rowCount) {
      log(`content ${checksum} already seeded`);
      await q("rollback");
      return;
    }
    const versionLabel = label ?? `seed-${new Date().toISOString().slice(0, 10)}-${checksum}`;
    const { rows: [version] } = await q(
      "insert into public.content_versions (label, source, checksum, item_counts) values ($1, 'seed:hand-authored', $2, $3) returning id",
      [versionLabel, checksum, counts],
    );
    const vid = version.id as string;

    for (const i of issues) {
      await q("insert into public.content_validation_results (content_version_id, entity_type, entity_slug, severity, code, message) values ($1,$2,$3,$4,$5,$6)",
        [vid, i.entity, i.slug, i.severity, i.code, i.message]);
    }

    for (const l of levels) {
      await q(`insert into public.curriculum_levels (code, ordinal, title_en, title_he, description_en, description_he) values ($1,$2,$3,$4,$5,$6)
        on conflict (code) do update set title_en=excluded.title_en, title_he=excluded.title_he, description_en=excluded.description_en, description_he=excluded.description_he`,
        [l.code, l.ordinal, l.title_en, l.title_he, l.description_en, l.description_he]);
    }
    for (const [i, c] of categories.entries()) {
      await q(`insert into public.curriculum_categories (slug, title_en, title_he, sort) values ($1,$2,$3,$4)
        on conflict (slug) do update set title_en=excluded.title_en, title_he=excluded.title_he, sort=excluded.sort`, [c.slug, c.title_en, c.title_he, i]);
    }

    const grammarIds = new Map<string, string>();
    for (const [i, g] of parsed.grammar.entries()) {
      const { rows } = await q(`insert into public.grammar_topics (slug, level, title_en, title_he, summary_en, summary_he, rules, examples, common_mistakes, sort)
        values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        on conflict (slug) do update set level=excluded.level, title_en=excluded.title_en, title_he=excluded.title_he, summary_en=excluded.summary_en,
          summary_he=excluded.summary_he, rules=excluded.rules, examples=excluded.examples, common_mistakes=excluded.common_mistakes, sort=excluded.sort
        returning id`,
        [g.slug, g.level, g.title_en, g.title_he, g.summary_en, g.summary_he, JSON.stringify(g.rules), JSON.stringify(g.examples), JSON.stringify(g.mistakes), i]);
      grammarIds.set(g.slug, rows[0].id);
    }

    const vocabIds = new Map<string, string>();
    for (const v of parsed.vocabulary) {
      const { rows } = await q(`insert into public.vocabulary (lemma, part_of_speech, level, ipa_us, tags, synonyms, antonyms, related)
        values ($1,$2,$3,$4,$5,$6,$7,$8)
        on conflict (lower(lemma), part_of_speech) where owner_id is null do update set level=excluded.level, ipa_us=excluded.ipa_us,
          tags=excluded.tags, synonyms=excluded.synonyms, antonyms=excluded.antonyms, related=excluded.related
        returning id`, [v.lemma, v.pos, v.level, v.ipa ?? null, v.tags, v.synonyms, v.antonyms, v.related]);
      const id = rows[0].id as string;
      vocabIds.set(v.lemma.toLowerCase(), id);
      await q("delete from public.vocabulary_examples where vocabulary_id = $1", [id]);
      await q("delete from public.vocabulary_meanings where vocabulary_id = $1", [id]);
      for (const [i, m] of v.meanings.entries()) {
        await q(`insert into public.vocabulary_meanings (vocabulary_id, sense_order, definition_en, translations_he, usage_note_he, register) values ($1,$2,$3,$4,$5,$6)`,
          [id, i + 1, m.en, m.he, m.note_he ?? null, m.register ?? null]);
      }
      for (const e of v.examples) {
        await q("insert into public.vocabulary_examples (vocabulary_id, sentence_en, translation_he) values ($1,$2,$3)", [id, e.en, e.he ?? null]);
      }
    }

    const listeningIds = new Map<string, string>();
    for (const l of parsed.listening) {
      const { rows } = await q(`insert into public.listening_materials (slug, level, format, title_en, title_he, context_he, segments, glossary, accent, status, content_version_id)
        values ($1,$2,$3,$4,$5,$6,$7,$8,$9,'approved',$10)
        on conflict (slug) do update set level=excluded.level, format=excluded.format, title_en=excluded.title_en, title_he=excluded.title_he,
          context_he=excluded.context_he, segments=excluded.segments, glossary=excluded.glossary, accent=excluded.accent, status='approved', content_version_id=excluded.content_version_id
        returning id`, [l.slug, l.level, l.format, l.title_en, l.title_he, l.context_he ?? null, JSON.stringify(l.segments), JSON.stringify(l.glossary), l.accent, vid]);
      listeningIds.set(l.slug, rows[0].id);
    }

    const exerciseRefs = (ex: Exercise) => ({
      grammar: ex.grammar ? grammarIds.get(ex.grammar) ?? null : null,
      vocab: ex.vocab ? vocabIds.get(ex.vocab.toLowerCase()) ?? null : null,
      listening: "listening" in ex ? listeningIds.get(ex.listening) ?? null : null,
    });
    const publicPrompt = (ex: Exercise) => ({
      ...ex.prompt,
      ...("segment" in ex ? { segment: ex.segment } : {}),
    });

    await q("update public.lessons set status = 'retired' where status = 'approved'");
    await q("update public.exercises set status = 'retired' where status = 'approved'");
    await q("update public.curriculum_units set status = 'retired' where status = 'approved'");
    await q("update public.curriculum_courses set status = 'retired' where status = 'approved'");

    for (const [ci, c] of parsed.courses.entries()) {
      const { rows: [course] } = await q(`insert into public.curriculum_courses (slug, category_slug, level, title_en, title_he, description_en, description_he, goals, sort, status, content_version_id)
        values ($1,$2,$3,$4,$5,$6,$7,$8,$9,'approved',$10)
        on conflict (slug) do update set category_slug=excluded.category_slug, level=excluded.level, title_en=excluded.title_en, title_he=excluded.title_he,
          description_en=excluded.description_en, description_he=excluded.description_he, goals=excluded.goals, sort=excluded.sort, status='approved', content_version_id=excluded.content_version_id
        returning id`, [c.slug, c.category, c.level, c.title_en, c.title_he, c.description_en, c.description_he, c.goals, ci, vid]);
      for (const [mi, m] of c.modules.entries()) {
        const { rows: [mod] } = await q(`insert into public.curriculum_modules (course_id, slug, title_en, title_he, sort) values ($1,$2,$3,$4,$5)
          on conflict (slug) do update set course_id=excluded.course_id, title_en=excluded.title_en, title_he=excluded.title_he, sort=excluded.sort returning id`,
          [course.id, m.slug, m.title_en, m.title_he, mi]);
        for (const [ui, u] of m.units.entries()) {
          const { rows: [unit] } = await q(`insert into public.curriculum_units (module_id, slug, level, title_en, title_he, objectives, prerequisites, completion_criteria, sort, status, content_version_id)
            values ($1,$2,$3,$4,$5,$6,$7,$8,$9,'approved',$10)
            on conflict (slug) do update set module_id=excluded.module_id, level=excluded.level, title_en=excluded.title_en, title_he=excluded.title_he,
              objectives=excluded.objectives, prerequisites=excluded.prerequisites, completion_criteria=excluded.completion_criteria, sort=excluded.sort, status='approved', content_version_id=excluded.content_version_id
            returning id`, [mod.id, u.slug, u.level, u.title_en, u.title_he, JSON.stringify(u.objectives), u.prerequisites, JSON.stringify(u.completion), ui, vid]);
          await q("delete from public.unit_grammar_topics where unit_id = $1", [unit.id]);
          await q("delete from public.unit_vocabulary where unit_id = $1", [unit.id]);
          for (const g of u.grammar) await q("insert into public.unit_grammar_topics values ($1,$2)", [unit.id, grammarIds.get(g)]);
          for (const w of u.vocabulary) await q("insert into public.unit_vocabulary values ($1,$2)", [unit.id, vocabIds.get(w.toLowerCase())]);

          for (const [li, l] of u.lessons.entries()) {
            const { rows: [lesson] } = await q(`insert into public.lessons (unit_id, slug, kind, title_en, title_he, intro_en, intro_he, estimated_minutes, sort, status, content_version_id)
              values ($1,$2,$3,$4,$5,$6,$7,$8,$9,'approved',$10)
              on conflict (slug) do update set unit_id=excluded.unit_id, kind=excluded.kind, title_en=excluded.title_en, title_he=excluded.title_he, intro_en=excluded.intro_en,
                intro_he=excluded.intro_he, estimated_minutes=excluded.estimated_minutes, sort=excluded.sort, status='approved', content_version_id=excluded.content_version_id
              returning id`, [unit.id, l.slug, l.kind, l.title_en, l.title_he, l.intro_en, l.intro_he, l.minutes, li, vid]);
            for (const [ei, ex] of l.exercises.entries()) {
              const refs = exerciseRefs(ex);
              const { rows: [exRow] } = await q(`insert into public.exercises (slug, lesson_id, type, skill, level, prompt, explanation_en, explanation_he, grammar_topic_id, vocabulary_id, listening_material_id, sort, status, content_version_id)
                values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'approved',$13)
                on conflict (slug) do update set lesson_id=excluded.lesson_id, type=excluded.type, skill=excluded.skill, level=excluded.level, prompt=excluded.prompt,
                  explanation_en=excluded.explanation_en, explanation_he=excluded.explanation_he, grammar_topic_id=excluded.grammar_topic_id, vocabulary_id=excluded.vocabulary_id,
                  listening_material_id=excluded.listening_material_id, sort=excluded.sort, status='approved', content_version_id=excluded.content_version_id
                returning id`,
                [`${l.slug}-${ei + 1}`, lesson.id, ex.type, ex.skill, u.level, JSON.stringify(publicPrompt(ex)), ex.explanation_en, ex.explanation_he, refs.grammar, refs.vocab, refs.listening, ei, vid]);
              await q("insert into public.exercise_keys (exercise_id, answer) values ($1,$2) on conflict (exercise_id) do update set answer = excluded.answer",
                [exRow.id, JSON.stringify(ex.answer)]);
            }
          }
        }
      }
    }

    for (const a of parsed.assessment) {
      const ex = a.exercise;
      const { rows: [it] } = await q(`insert into public.assessment_items (slug, skill, level, type, prompt, status, content_version_id) values ($1,$2,$3,$4,$5,'approved',$6)
        on conflict (slug) do update set skill=excluded.skill, level=excluded.level, type=excluded.type, prompt=excluded.prompt, status='approved', content_version_id=excluded.content_version_id
        returning id`, [a.slug, a.skill, a.level, ex.type, JSON.stringify({ ...publicPrompt(ex), ...("listening" in ex ? { listening: ex.listening } : {}) }), vid]);
      await q("insert into public.assessment_item_keys (item_id, answer) values ($1,$2) on conflict (item_id) do update set answer = excluded.answer", [it.id, JSON.stringify(ex.answer)]);
    }

    await q("commit");
    log(`seeded content ${versionLabel}: ${JSON.stringify(counts)}`);
  } catch (e) {
    await q("rollback").catch(() => {});
    throw e;
  } finally {
    await client.end();
  }
}

if (process.argv[1]?.endsWith("content-seed.ts")) {
  const url = process.env.DATABASE_URL;
  if (!url) { console.error("DATABASE_URL missing"); process.exit(1); }
  const label = process.argv.find((a) => a.startsWith("--label="))?.slice(8);
  seedContent(url, label).catch((e) => { console.error(e); process.exit(1); });
}
